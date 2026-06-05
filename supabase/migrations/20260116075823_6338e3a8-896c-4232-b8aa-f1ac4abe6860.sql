-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Remover política permissiva e criar uma mais restritiva para analytics
DROP POLICY IF EXISTS "Qualquer um pode inserir analytics" ON public.analytics;

CREATE POLICY "Usuários podem inserir analytics de suas ações"
  ON public.analytics FOR INSERT
  WITH CHECK (
    tipo_evento IN ('page_view', 'click_empresa', 'click_whatsapp', 'click_telefone', 'click_site')
  );