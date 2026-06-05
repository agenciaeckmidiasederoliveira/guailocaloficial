
-- Remove overly broad policy
DROP POLICY IF EXISTS "Qualquer pessoa pode verificar convite por token" ON public.parceiros;

-- Create a SECURITY DEFINER function to claim invite by token
CREATE OR REPLACE FUNCTION public.claim_parceiro_invite(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parceiro_id uuid;
  v_user_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Check if token exists and email slot is available (email matches or parceiro was created with this email)
  SELECT id INTO v_parceiro_id FROM public.parceiros WHERE convite_token = p_token;
  IF v_parceiro_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is already a parceiro
  IF EXISTS (SELECT 1 FROM public.parceiros WHERE email = v_user_email) THEN
    RETURN true; -- Already a parceiro
  END IF;

  -- Update parceiro email to this user
  UPDATE public.parceiros SET email = v_user_email WHERE id = v_parceiro_id AND email = '';
  
  -- If the email was already set (admin pre-filled), check if it matches
  IF NOT FOUND THEN
    -- Check if the parceiro email matches
    IF EXISTS (SELECT 1 FROM public.parceiros WHERE id = v_parceiro_id AND email = v_user_email) THEN
      -- Already matches, just update profile
      NULL;
    ELSE
      RETURN false; -- Token already used by someone else
    END IF;
  END IF;

  -- Update user profile to parceiro
  UPDATE public.profiles SET role = 'parceiro' WHERE id = auth.uid() AND role = 'user';
  
  RETURN true;
END;
$$;
