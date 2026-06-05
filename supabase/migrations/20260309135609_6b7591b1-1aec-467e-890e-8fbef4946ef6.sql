-- Allow authenticated users to check if their own email is in parceiros
CREATE POLICY "Usuarios podem verificar proprio email"
ON public.parceiros
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));