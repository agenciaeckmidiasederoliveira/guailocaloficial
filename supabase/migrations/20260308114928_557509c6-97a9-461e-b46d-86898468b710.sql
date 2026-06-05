
-- Fix analytics RLS: allow anonymous inserts (current policy requires authenticated)
-- Drop existing insert policy and recreate with public access
DROP POLICY IF EXISTS "Qualquer pessoa pode inserir analytics" ON public.analytics;

CREATE POLICY "Qualquer pessoa pode inserir analytics"
ON public.analytics
FOR INSERT
TO public
WITH CHECK (
  tipo_evento = ANY (ARRAY[
    'page_view'::text, 'click_empresa'::text, 'click_whatsapp'::text,
    'click_telefone'::text, 'click_site'::text, 'busca'::text,
    'favorito_add'::text, 'favorito_remove'::text, 'cadastro_inicio'::text,
    'cadastro_completo'::text, 'banner_click'::text, 'share'::text
  ])
);
