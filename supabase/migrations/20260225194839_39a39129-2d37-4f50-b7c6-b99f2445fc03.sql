
-- Add new columns to analytics for richer tracking
ALTER TABLE public.analytics 
  ADD COLUMN IF NOT EXISTS busca_termo text,
  ADD COLUMN IF NOT EXISTS dispositivo text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS session_id text;

-- Update the INSERT policy to allow new event types
DROP POLICY IF EXISTS "Usuários autenticados podem inserir analytics" ON public.analytics;

CREATE POLICY "Qualquer pessoa pode inserir analytics"
ON public.analytics
FOR INSERT
TO public
WITH CHECK (
  tipo_evento = ANY (ARRAY[
    'page_view'::text, 
    'click_empresa'::text, 
    'click_whatsapp'::text, 
    'click_telefone'::text, 
    'click_site'::text,
    'busca'::text,
    'favorito_add'::text,
    'favorito_remove'::text,
    'cadastro_inicio'::text,
    'cadastro_completo'::text,
    'banner_click'::text,
    'share'::text
  ])
);
