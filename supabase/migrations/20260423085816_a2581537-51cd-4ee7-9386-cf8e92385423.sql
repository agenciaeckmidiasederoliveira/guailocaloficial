
-- Normalizar e-mails existentes
UPDATE public.parceiros
SET email = lower(email)
WHERE email <> lower(email);

-- Função de aceitar convite tolerante a maiúsculas/minúsculas
CREATE OR REPLACE FUNCTION public.claim_parceiro_invite(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_parceiro_id uuid;
  v_parceiro_email text;
  v_user_email text;
BEGIN
  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT id, lower(email) INTO v_parceiro_id, v_parceiro_email
  FROM public.parceiros WHERE convite_token = p_token;
  IF v_parceiro_id IS NULL THEN
    RETURN false;
  END IF;

  -- Já é parceiro com este e-mail? Sincroniza role e ok
  IF EXISTS (SELECT 1 FROM public.parceiros WHERE lower(email) = v_user_email) THEN
    UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
    RETURN true;
  END IF;

  -- Slot vazio: associa este usuário ao parceiro
  IF v_parceiro_email = '' OR v_parceiro_email IS NULL THEN
    UPDATE public.parceiros SET email = v_user_email WHERE id = v_parceiro_id;
    UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

-- Trigger para normalizar e-mail em INSERT/UPDATE futuros
CREATE OR REPLACE FUNCTION public.normalize_parceiro_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.email := lower(coalesce(NEW.email, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_parceiro_email ON public.parceiros;
CREATE TRIGGER trg_normalize_parceiro_email
BEFORE INSERT OR UPDATE OF email ON public.parceiros
FOR EACH ROW
EXECUTE FUNCTION public.normalize_parceiro_email();

-- Índice único no token de convite
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'parceiros_convite_token_unique_idx') THEN
    CREATE UNIQUE INDEX parceiros_convite_token_unique_idx ON public.parceiros(convite_token);
  END IF;
END$$;
