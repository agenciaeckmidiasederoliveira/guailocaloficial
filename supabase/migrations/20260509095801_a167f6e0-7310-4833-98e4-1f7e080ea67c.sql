
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('empresa', 'artigo')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  tags TEXT[] DEFAULT '{}',
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  empresa_nome TEXT,
  empresa_cidade TEXT,
  empresa_categoria TEXT,
  empresa_telefone TEXT,
  empresa_whatsapp TEXT,
  empresa_site TEXT,
  empresa_endereco TEXT,
  empresa_foto_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  schema_json JSONB,
  tempo_leitura INT DEFAULT 5,
  visualizacoes INT DEFAULT 0,
  publicado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_tipo ON public.blog_posts(tipo);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_empresa_id ON public.blog_posts(empresa_id);
CREATE INDEX idx_blog_posts_publicado_em ON public.blog_posts(publicado_em DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts publicados sao publicos"
  ON public.blog_posts FOR SELECT
  USING (status = 'publicado' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insere posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin atualiza posts"
  ON public.blog_posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin deleta posts"
  ON public.blog_posts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role gerencia posts"
  ON public.blog_posts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.incrementar_visualizacao_post(post_slug TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE slug = post_slug AND status = 'publicado';
$$;
