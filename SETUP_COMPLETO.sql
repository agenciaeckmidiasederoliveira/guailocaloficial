-- ============================================================
-- GUIA LOCAL BR - SCRIPT DE SETUP COMPLETO
-- Execute TUDO isso no SQL Editor do seu Supabase (app.supabase.com)
-- Seção: SQL Editor → New Query → Cole e clique em Run
-- ============================================================

-- 1. GARANTIR QUE A TABELA PROFILES EXISTE COM TRIGGER
-- (Cria o perfil automaticamente quando um usuário se registra)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  role TEXT DEFAULT 'empresa_gratis',
  avatar_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL USING (true);  -- service role bypasses RLS anyway

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'empresa_gratis')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. GARANTIR QUE A TABELA PARCEIROS EXISTE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_comercial TEXT NOT NULL,
  email TEXT,
  whatsapp_vendas TEXT,
  whatsapp_contato TEXT,
  nivel INTEGER DEFAULT 1,  -- 1 = master, 2 = sub
  limite_cidades INTEGER DEFAULT 50,
  percentual_comissao INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parceiros_public_read" ON public.parceiros;
CREATE POLICY "parceiros_public_read" ON public.parceiros FOR SELECT USING (true);
CREATE POLICY "parceiros_own_update" ON public.parceiros FOR UPDATE USING (auth.uid() = profile_id);

-- ============================================================
-- 3. CRIAR O USUÁRIO ADMIN (EDER OLIVEIRA)
-- ATENÇÃO: Primeiro crie o usuário no Supabase Auth UI:
-- Authentication → Users → Add User
-- Email: eder@guialocalbr.com.br | Senha: Admin@GuiaLocal2024
-- Depois rode o SQL abaixo substituindo o UUID real do usuário:
-- ============================================================

-- PASSO 3A: Descubra o UUID do usuário Eder rodando esta query:
-- SELECT id FROM auth.users WHERE email = 'eder@guialocalbr.com.br';

-- PASSO 3B: Cole o UUID retornado no lugar de 'UUID_DO_EDER_AQUI':
-- UPDATE public.profiles SET role = 'admin', nome = 'Eder Oliveira' WHERE id = 'UUID_DO_EDER_AQUI';

-- ============================================================
-- 4. CRIAR PERFIL DO PARCEIRO JULIO (se ele já existe no Auth)
-- ============================================================

-- PASSO 4A: Descubra o UUID do usuário Julio:
-- SELECT id FROM auth.users WHERE email = 'ojulio.domingos@gmail.com';

-- PASSO 4B: Cole o UUID abaixo (exemplo de fluxo):
-- DO $$
-- DECLARE julio_profile_id UUID;
-- BEGIN
--   SELECT id INTO julio_profile_id FROM auth.users WHERE email = 'ojulio.domingos@gmail.com';
--   
--   -- Atualiza o role
--   UPDATE public.profiles SET role = 'parceiro_master', nome = 'Julio Domingo' WHERE id = julio_profile_id;
--   
--   -- Cria o registro do parceiro
--   INSERT INTO public.parceiros (profile_id, nome_comercial, email, whatsapp_vendas, nivel, limite_cidades)
--   VALUES (julio_profile_id, 'Julio Domingo - Parceiro Maringá', 'ojulio.domingos@gmail.com', '44988436180', 1, 50)
--   ON CONFLICT DO NOTHING;
-- END $$;

-- ============================================================
-- 5. RLS PARA TODAS AS TABELAS PRINCIPAIS
-- ============================================================

-- Empresas
ALTER TABLE IF EXISTS public.empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "empresas_public_read" ON public.empresas;
DROP POLICY IF EXISTS "empresas_public_insert" ON public.empresas;
DROP POLICY IF EXISTS "empresas_partner_manage" ON public.empresas;
CREATE POLICY "empresas_public_read" ON public.empresas FOR SELECT USING (true);
CREATE POLICY "empresas_public_insert" ON public.empresas FOR INSERT WITH CHECK (true);
CREATE POLICY "empresas_partner_manage" ON public.empresas FOR UPDATE USING (
  auth.uid() IN (SELECT profile_id FROM public.parceiros WHERE id = parceiro_id)
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cidades
ALTER TABLE IF EXISTS public.cidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cidades_public_read" ON public.cidades;
CREATE POLICY "cidades_public_read" ON public.cidades FOR SELECT USING (true);

-- Categorias
ALTER TABLE IF EXISTS public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categorias_public_read" ON public.categorias;
CREATE POLICY "categorias_public_read" ON public.categorias FOR SELECT USING (true);

-- Bairros
ALTER TABLE IF EXISTS public.bairros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bairros_public_read" ON public.bairros;
CREATE POLICY "bairros_public_read" ON public.bairros FOR SELECT USING (true);

-- Parceiro Cidades
ALTER TABLE IF EXISTS public.parceiro_cidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parceiro_cidades_public_read" ON public.parceiro_cidades;
CREATE POLICY "parceiro_cidades_public_read" ON public.parceiro_cidades FOR SELECT USING (true);

-- Avaliacoes
ALTER TABLE IF EXISTS public.avaliacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "avaliacoes_public_read" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_public_insert" ON public.avaliacoes;
CREATE POLICY "avaliacoes_public_read" ON public.avaliacoes FOR SELECT USING (true);
CREATE POLICY "avaliacoes_public_insert" ON public.avaliacoes FOR INSERT WITH CHECK (true);

-- Analytics
ALTER TABLE IF EXISTS public.analytics_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_insert" ON public.analytics_eventos;
CREATE POLICY "analytics_insert" ON public.analytics_eventos FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_select_partner" ON public.analytics_eventos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'parceiro_master', 'sub_parceiro'))
);

-- Leads
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_select_partner" ON public.leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'parceiro_master', 'sub_parceiro'))
);

-- ============================================================
-- 6. VERIFICAÇÃO FINAL - RODE ISSO PARA CONFIRMAR:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM public.profiles LIMIT 10;
-- ============================================================
