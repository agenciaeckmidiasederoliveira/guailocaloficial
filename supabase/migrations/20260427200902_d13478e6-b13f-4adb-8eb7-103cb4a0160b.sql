-- Tabela de páginas SEO programáticas
CREATE TABLE IF NOT EXISTS public.seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  categoria text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  bairro text,
  titulo_h1 text NOT NULL,
  meta_title text NOT NULL,
  meta_description text NOT NULL,
  conteudo_intro text NOT NULL,
  conteudo_faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_empresas integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_ativo ON public.seo_pages(ativo);
CREATE INDEX IF NOT EXISTS idx_seo_pages_cat_cid ON public.seo_pages(categoria, cidade, estado);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

-- Leitura pública (apenas ativas para anônimos, admins veem tudo)
CREATE POLICY "SEO pages ativas sao publicas"
ON public.seo_pages FOR SELECT
USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia seo_pages"
ON public.seo_pages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role insere seo_pages"
ON public.seo_pages FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role atualiza seo_pages"
ON public.seo_pages FOR UPDATE
TO service_role
USING (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_seo_pages_updated_at ON public.seo_pages;
CREATE TRIGGER trg_seo_pages_updated_at
BEFORE UPDATE ON public.seo_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();