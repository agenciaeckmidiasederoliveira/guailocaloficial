
-- Renomear tabelas
ALTER TABLE IF EXISTS public.business_pages RENAME TO client_pages;
ALTER TABLE IF EXISTS public.business_service_pages RENAME TO client_service_pages;

-- Adicionar novos campos em client_pages (sem remover nenhum existente)
ALTER TABLE public.client_pages
  ADD COLUMN IF NOT EXISTS bairros jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_bairros integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cliques_whatsapp integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nome_empresa text,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS descricao_original text;

-- Garantir defaults para os campos de métricas (não derruba dados existentes)
ALTER TABLE public.client_pages
  ALTER COLUMN posicao_google_estimada SET DEFAULT 3,
  ALTER COLUMN cpc_equivalente SET DEFAULT 12,
  ALTER COLUMN investimento_ads_equivalente SET DEFAULT 0;

-- Renomear coluna posicao_google_estimada -> posicao_estimada para alinhar com o novo modelo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='posicao_google_estimada'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='posicao_estimada'
  ) THEN
    ALTER TABLE public.client_pages RENAME COLUMN posicao_google_estimada TO posicao_estimada;
  END IF;
END $$;

-- Renomear investimento_ads_equivalente -> economia_ads_anual
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='investimento_ads_equivalente'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='economia_ads_anual'
  ) THEN
    ALTER TABLE public.client_pages RENAME COLUMN investimento_ads_equivalente TO economia_ads_anual;
  END IF;
END $$;

-- Renomear visualizacoes_pagina -> visualizacoes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='visualizacoes_pagina'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='client_pages' AND column_name='visualizacoes'
  ) THEN
    ALTER TABLE public.client_pages RENAME COLUMN visualizacoes_pagina TO visualizacoes;
  END IF;
END $$;

-- Índice para busca por slug (pode já existir, IF NOT EXISTS é seguro)
CREATE INDEX IF NOT EXISTS idx_client_pages_slug ON public.client_pages(slug);
CREATE INDEX IF NOT EXISTS idx_client_pages_status ON public.client_pages(status);
CREATE INDEX IF NOT EXISTS idx_client_pages_business_id ON public.client_pages(business_id);

-- Função pública (segura) para incrementar visualizações sem exigir login nem RLS update
CREATE OR REPLACE FUNCTION public.increment_client_page_views(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.client_pages
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE slug = p_slug AND status = 'ativo';
$$;

-- Função pública para incrementar cliques no WhatsApp
CREATE OR REPLACE FUNCTION public.increment_client_page_whatsapp(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.client_pages
  SET cliques_whatsapp = COALESCE(cliques_whatsapp, 0) + 1
  WHERE slug = p_slug AND status = 'ativo';
$$;

GRANT EXECUTE ON FUNCTION public.increment_client_page_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_client_page_whatsapp(text) TO anon, authenticated;
