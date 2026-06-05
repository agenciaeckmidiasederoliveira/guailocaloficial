-- 1) Remove sistema antigo de SEO Programático
DROP TABLE IF EXISTS public.seo_pages CASCADE;

-- 2) Cria nova tabela business_pages
CREATE TABLE public.business_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendente',
  plano TEXT NOT NULL DEFAULT 'basico',

  -- Conteúdo gerado por IA
  hero_titulo TEXT,
  hero_subtitulo TEXT,
  hero_cta_texto TEXT DEFAULT 'Falar no WhatsApp',
  sobre_texto TEXT,
  servicos JSONB DEFAULT '[]'::jsonb,
  diferenciais JSONB DEFAULT '[]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  blog_posts JSONB DEFAULT '[]'::jsonb,
  depoimentos JSONB DEFAULT '[]'::jsonb,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  schema_json JSONB DEFAULT '{}'::jsonb,

  -- Configurações
  cor_primaria TEXT DEFAULT '#16a34a',
  whatsapp TEXT,
  email_contato TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  categoria TEXT,
  horario_funcionamento JSONB DEFAULT '{}'::jsonb,

  -- Agendamento
  agendamento_ativo BOOLEAN DEFAULT false,
  agendamento_link TEXT,

  -- Galeria
  fotos JSONB DEFAULT '[]'::jsonb,

  -- Métricas
  posicao_google_estimada INTEGER DEFAULT 0,
  cliques_mes_estimado INTEGER DEFAULT 0,
  cpc_equivalente NUMERIC DEFAULT 0,
  investimento_ads_equivalente NUMERIC DEFAULT 0,
  visualizacoes_pagina INTEGER DEFAULT 0,
  contatos_gerados INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  publicado_at TIMESTAMPTZ,

  CONSTRAINT business_pages_status_check CHECK (status IN ('pendente','gerando','ativo','pausado','erro')),
  CONSTRAINT business_pages_plano_check CHECK (plano IN ('basico','profissional','premium','free'))
);

CREATE INDEX idx_business_pages_slug ON public.business_pages(slug);
CREATE INDEX idx_business_pages_business_id ON public.business_pages(business_id);
CREATE INDEX idx_business_pages_status ON public.business_pages(status);

-- 3) RLS
ALTER TABLE public.business_pages ENABLE ROW LEVEL SECURITY;

-- Leitura pública de páginas ativas; admin e dono veem tudo
CREATE POLICY "Paginas ativas sao publicas"
ON public.business_pages
FOR SELECT
USING (
  status = 'ativo'
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = business_pages.business_id
      AND e.usuario_id = auth.uid()
  )
);

-- Dono da empresa pode atualizar a própria página
CREATE POLICY "Dono atualiza sua pagina"
ON public.business_pages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = business_pages.business_id
      AND e.usuario_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Admin pode tudo
CREATE POLICY "Admin gerencia business_pages"
ON public.business_pages
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role insere/atualiza (geração via edge function)
CREATE POLICY "Service insere business_pages"
ON public.business_pages
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service atualiza business_pages"
ON public.business_pages
FOR UPDATE
TO service_role
USING (true);

-- Trigger updated_at
CREATE TRIGGER update_business_pages_updated_at
BEFORE UPDATE ON public.business_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();