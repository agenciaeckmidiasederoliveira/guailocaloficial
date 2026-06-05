
ALTER TABLE public.parceiros
  ADD COLUMN IF NOT EXISTS is_master boolean NOT NULL DEFAULT false;

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
  v_is_master boolean;
  v_nivel text;
  v_cota_premium integer;
BEGIN
  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT id, lower(email), is_master, nivel, cota_premium
    INTO v_parceiro_id, v_parceiro_email, v_is_master, v_nivel, v_cota_premium
  FROM public.parceiros WHERE convite_token = p_token;
  IF v_parceiro_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.parceiros WHERE lower(email) = v_user_email AND is_master = false) THEN
    UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
    RETURN true;
  END IF;

  IF v_is_master THEN
    INSERT INTO public.parceiros (email, nome, nivel, cota_premium, is_master)
    VALUES (v_user_email, split_part(v_user_email,'@',1), v_nivel, v_cota_premium, false);
    UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
    RETURN true;
  END IF;

  IF v_parceiro_email = '' OR v_parceiro_email IS NULL THEN
    UPDATE public.parceiros SET email = v_user_email WHERE id = v_parceiro_id;
    UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

INSERT INTO public.parceiros (email, nome, nivel, cota_premium, is_master, convite_token)
SELECT '', 'Convite Mestre Diamante', 'diamante', 150, true, 'diamante-master-vip'
WHERE NOT EXISTS (SELECT 1 FROM public.parceiros WHERE convite_token = 'diamante-master-vip');

UPDATE public.parceiros
SET nivel = 'diamante', cota_premium = 150, is_master = true
WHERE convite_token = 'diamante-master-vip';
