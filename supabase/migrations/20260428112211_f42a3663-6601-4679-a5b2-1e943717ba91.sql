-- Tabela de subpáginas de serviço (filhas de business_pages)
CREATE TABLE IF NOT EXISTS public.business_service_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.business_pages(id) ON DELETE CASCADE,
  business_id uuid NOT NULL,
  slug_servico text NOT NULL,
  servico_nome text NOT NULL,
  servico_descricao text,
  cidade_alvo text,
  status text NOT NULL DEFAULT 'ativo',
  hero_titulo text,
  hero_subtitulo text,
  intro text,
  secoes jsonb DEFAULT '[]'::jsonb,
  faq jsonb DEFAULT '[]'::jsonb,
  schema_json jsonb DEFAULT '{}'::jsonb,
  meta_title text,
  meta_description text,
  visualizacoes int DEFAULT 0,
  contatos_gerados int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, slug_servico)
);

CREATE INDEX IF NOT EXISTS idx_bsp_business ON public.business_service_pages(business_id);
CREATE INDEX IF NOT EXISTS idx_bsp_page ON public.business_service_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_bsp_slug ON public.business_service_pages(slug_servico);

ALTER TABLE public.business_service_pages ENABLE ROW LEVEL SECURITY;

-- Leitura pública das ativas; dono e admin veem tudo
CREATE POLICY "Subpaginas ativas sao publicas"
ON public.business_service_pages
FOR SELECT
USING (
  status = 'ativo'
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = business_service_pages.business_id
      AND e.usuario_id = auth.uid()
  )
);

-- Dono atualiza
CREATE POLICY "Dono atualiza subpaginas"
ON public.business_service_pages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = business_service_pages.business_id
      AND e.usuario_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admin gerencia tudo
CREATE POLICY "Admin gerencia subpaginas"
ON public.business_service_pages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Service role insere/atualiza (edge functions)
CREATE POLICY "Service insere subpaginas"
ON public.business_service_pages
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service atualiza subpaginas"
ON public.business_service_pages
FOR UPDATE
TO service_role
USING (true);

-- Trigger updated_at
CREATE TRIGGER trg_bsp_updated_at
BEFORE UPDATE ON public.business_service_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();