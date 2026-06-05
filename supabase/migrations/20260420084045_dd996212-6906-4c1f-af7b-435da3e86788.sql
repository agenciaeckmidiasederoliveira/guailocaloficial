
-- ============================================================
-- 1. SISTEMA DE ROLES SEGURO (user_roles + has_role)
-- ============================================================

-- Cria enum de roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'parceiro', 'user');
  END IF;
END $$;

-- Cria tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função has_role (security definer, evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies da user_roles
DROP POLICY IF EXISTS "Users veem suas roles" ON public.user_roles;
CREATE POLICY "Users veem suas roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Apenas admin gerencia roles" ON public.user_roles;
CREATE POLICY "Apenas admin gerencia roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migra roles existentes de profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::public.app_role
FROM public.profiles
WHERE role IS NOT NULL AND role IN ('admin', 'parceiro', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger que sincroniza role de profiles para user_roles (mantém compat)
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NOT NULL AND NEW.role IN ('admin', 'parceiro', 'user') THEN
    -- Remove roles antigas do user que não sejam a nova
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role::text != NEW.role;
    -- Insere a nova role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.profiles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role_to_user_roles();

-- ============================================================
-- 2. MILESTONES DE VIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.empresa_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  marco INTEGER NOT NULL,
  atingido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, marco)
);

ALTER TABLE public.empresa_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin ve milestones" ON public.empresa_milestones;
CREATE POLICY "Admin ve milestones"
ON public.empresa_milestones FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service insere milestones" ON public.empresa_milestones;
CREATE POLICY "Service insere milestones"
ON public.empresa_milestones FOR INSERT
TO service_role
WITH CHECK (true);

-- Função que checa milestones (chamada periodicamente ou após page_view)
CREATE OR REPLACE FUNCTION public.check_empresa_milestones(p_empresa_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views BIGINT;
  v_marco INTEGER;
  v_marcos INTEGER[] := ARRAY[100, 500, 1000, 5000, 10000];
  v_parceiro_id UUID;
  v_empresa_nome TEXT;
BEGIN
  -- Conta views únicas (page_view) da empresa
  SELECT COUNT(*) INTO v_views
  FROM public.analytics
  WHERE empresa_id = p_empresa_id
    AND tipo_evento = 'page_view';

  -- Acha o parceiro dono
  SELECT p.id, e.nome INTO v_parceiro_id, v_empresa_nome
  FROM public.empresas e
  JOIN public.profiles pr ON pr.id = e.usuario_id
  JOIN public.parceiros p ON p.email = pr.email
  WHERE e.id = p_empresa_id
  LIMIT 1;

  IF v_parceiro_id IS NULL THEN
    RETURN;
  END IF;

  -- Para cada marco, se atingiu e ainda não foi registrado, insere
  FOREACH v_marco IN ARRAY v_marcos LOOP
    IF v_views >= v_marco THEN
      INSERT INTO public.empresa_milestones (empresa_id, marco)
      VALUES (p_empresa_id, v_marco)
      ON CONFLICT (empresa_id, marco) DO NOTHING;

      -- Se foi inserido agora (acabou de atingir), notifica
      IF FOUND THEN
        INSERT INTO public.notificacoes_parceiro (parceiro_id, empresa_id, tipo, titulo, mensagem)
        VALUES (
          v_parceiro_id,
          p_empresa_id,
          'milestone_views',
          '🎯 ' || v_marco || ' visualizações alcançadas!',
          'Parabéns! ' || v_empresa_nome || ' atingiu ' || v_marco || ' visualizações no Guia Local BR.'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 3. RECOMPENSA POR SUBIR DE NÍVEL
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_parceiro_on_level_up()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_niveis_ordem TEXT[] := ARRAY['bronze', 'prata', 'ouro', 'diamante'];
  v_old_idx INTEGER;
  v_new_idx INTEGER;
  v_titulo TEXT;
  v_msg TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.nivel IS DISTINCT FROM NEW.nivel THEN
    v_old_idx := array_position(v_niveis_ordem, OLD.nivel);
    v_new_idx := array_position(v_niveis_ordem, NEW.nivel);

    -- Só recompensa se SUBIU
    IF v_new_idx IS NOT NULL AND v_old_idx IS NOT NULL AND v_new_idx > v_old_idx THEN
      -- Adiciona +5 cotas extras
      NEW.cota_premium := COALESCE(NEW.cota_premium, 0) + 5;

      v_titulo := '🎉 Você subiu para ' || initcap(NEW.nivel) || '!';
      v_msg := 'Parabéns! Você foi promovido para o nível ' || initcap(NEW.nivel) ||
               ' e ganhou +5 cotas Premium de bônus. Continue cadastrando empresas!';

      INSERT INTO public.notificacoes_parceiro (parceiro_id, tipo, titulo, mensagem)
      VALUES (NEW.id, 'level_up', v_titulo, v_msg);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parceiro_level_up ON public.parceiros;
CREATE TRIGGER trg_parceiro_level_up
BEFORE UPDATE ON public.parceiros
FOR EACH ROW
EXECUTE FUNCTION public.notify_parceiro_on_level_up();

-- ============================================================
-- 4. ATIVA REALTIME nas notificações
-- ============================================================

ALTER TABLE public.notificacoes_parceiro REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificacoes_parceiro'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_parceiro';
  END IF;
END $$;
