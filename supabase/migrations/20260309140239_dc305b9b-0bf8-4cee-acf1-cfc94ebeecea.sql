
-- Add convite_token to parceiros for unique invite links
ALTER TABLE public.parceiros ADD COLUMN convite_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Update existing records with tokens
UPDATE public.parceiros SET convite_token = encode(gen_random_bytes(16), 'hex') WHERE convite_token IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.parceiros ALTER COLUMN convite_token SET NOT NULL;

-- Allow anonymous users to read parceiros by convite_token (for signup flow)
CREATE POLICY "Qualquer pessoa pode verificar convite por token"
ON public.parceiros
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the old restrictive policies that conflict
DROP POLICY IF EXISTS "Apenas admin pode ver parceiros" ON public.parceiros;
DROP POLICY IF EXISTS "Usuarios podem verificar proprio email" ON public.parceiros;

-- Recreate admin full access
CREATE POLICY "Admin pode ver todos parceiros"
ON public.parceiros
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Users can check their own email
CREATE POLICY "Usuarios verificam proprio email"
ON public.parceiros
FOR SELECT
TO authenticated
USING (email = public.get_auth_email());
