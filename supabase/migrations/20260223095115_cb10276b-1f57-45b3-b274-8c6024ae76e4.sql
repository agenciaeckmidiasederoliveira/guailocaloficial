-- Drop the old permissive INSERT policy on analytics
DROP POLICY IF EXISTS "Usuários podem inserir analytics de suas ações" ON public.analytics;

-- Create new INSERT policy requiring authentication
CREATE POLICY "Usuários autenticados podem inserir analytics"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (
  tipo_evento = ANY (ARRAY['page_view'::text, 'click_empresa'::text, 'click_whatsapp'::text, 'click_telefone'::text, 'click_site'::text])
);