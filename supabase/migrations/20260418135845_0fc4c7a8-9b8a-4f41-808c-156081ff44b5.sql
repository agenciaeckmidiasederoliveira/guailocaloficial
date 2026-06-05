
-- Tabela de notificações para parceiros
CREATE TABLE IF NOT EXISTS public.notificacoes_parceiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id uuid NOT NULL REFERENCES public.parceiros(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'aprovado', 'rejeitado', 'milestone_views'
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_parceiro ON public.notificacoes_parceiro(parceiro_id, lida, created_at DESC);

ALTER TABLE public.notificacoes_parceiro ENABLE ROW LEVEL SECURITY;

-- Policy: parceiro vê suas próprias notificações
CREATE POLICY "Parceiro ve suas notificacoes"
ON public.notificacoes_parceiro
FOR SELECT
TO authenticated
USING (
  parceiro_id IN (
    SELECT id FROM public.parceiros
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy: parceiro pode marcar como lida (update)
CREATE POLICY "Parceiro atualiza suas notificacoes"
ON public.notificacoes_parceiro
FOR UPDATE
TO authenticated
USING (
  parceiro_id IN (
    SELECT id FROM public.parceiros
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy: admin vê todas
CREATE POLICY "Admin ve todas notificacoes"
ON public.notificacoes_parceiro
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Service role pode inserir (triggers)
CREATE POLICY "Service insere notificacoes"
ON public.notificacoes_parceiro
FOR INSERT
TO service_role
WITH CHECK (true);

-- Função: cria notificação quando empresa muda de status
CREATE OR REPLACE FUNCTION public.notify_parceiro_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parceiro_id uuid;
  v_titulo text;
  v_mensagem text;
BEGIN
  -- Só notifica em mudança real de status
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Localiza o parceiro dono dessa empresa (via profile do usuário)
  SELECT p.id INTO v_parceiro_id
  FROM public.parceiros p
  JOIN public.profiles pr ON pr.email = p.email
  WHERE pr.id = NEW.usuario_id
  LIMIT 1;

  IF v_parceiro_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'aprovado' THEN
    v_titulo := 'Empresa aprovada! 🎉';
    v_mensagem := NEW.nome || ' foi aprovada e já está visível no Guia Local BR.';
  ELSIF NEW.status = 'rejeitado' THEN
    v_titulo := 'Empresa rejeitada';
    v_mensagem := NEW.nome || ' foi rejeitada. Verifique os dados e cadastre novamente.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notificacoes_parceiro (parceiro_id, empresa_id, tipo, titulo, mensagem)
  VALUES (v_parceiro_id, NEW.id, NEW.status, v_titulo, v_mensagem);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_parceiro_status ON public.empresas;
CREATE TRIGGER trg_notify_parceiro_status
AFTER INSERT OR UPDATE OF status ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.notify_parceiro_on_status_change();

-- RPC: contagem de notificações não lidas do parceiro logado
CREATE OR REPLACE FUNCTION public.count_minhas_notificacoes_nao_lidas()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.notificacoes_parceiro n
  WHERE n.lida = false
    AND n.parceiro_id IN (
      SELECT id FROM public.parceiros
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
$$;

-- RPC: marca todas como lidas
CREATE OR REPLACE FUNCTION public.marcar_notificacoes_lidas()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notificacoes_parceiro
  SET lida = true
  WHERE lida = false
    AND parceiro_id IN (
      SELECT id FROM public.parceiros
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
$$;
