-- Fase 1 SEO: campos para controle de link dofollow/nofollow e meta description personalizada
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'nofollow',
  ADD COLUMN IF NOT EXISTS schema_type text NOT NULL DEFAULT 'LocalBusiness',
  ADD COLUMN IF NOT EXISTS meta_description text;

-- Constraint para garantir valores válidos
ALTER TABLE public.empresas DROP CONSTRAINT IF EXISTS empresas_link_type_check;
ALTER TABLE public.empresas ADD CONSTRAINT empresas_link_type_check
  CHECK (link_type IN ('dofollow', 'nofollow'));

-- Sincroniza automaticamente: premium = dofollow, free = nofollow
CREATE OR REPLACE FUNCTION public.sync_empresa_link_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plano = 'premium' THEN
    NEW.link_type := 'dofollow';
  ELSE
    NEW.link_type := 'nofollow';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_empresa_link_type ON public.empresas;
CREATE TRIGGER trg_sync_empresa_link_type
BEFORE INSERT OR UPDATE OF plano ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.sync_empresa_link_type();

-- Atualiza registros existentes
UPDATE public.empresas SET link_type = CASE WHEN plano = 'premium' THEN 'dofollow' ELSE 'nofollow' END;