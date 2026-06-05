-- FASE 3: Expansão de IA, Rankings e SEO
-- Execute este script no SQL Editor do seu Supabase.

-- 1. FAQS e AVALIAÇÕES
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS faqs JSONB;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS resposta_empresa TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS resposta_gerada_ia TEXT;

-- 2. RANKING MENSAL
CREATE TABLE IF NOT EXISTS public.rankings_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id UUID NOT NULL REFERENCES public.cidades(id),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id),
  mes_referencia TEXT NOT NULL,
  posicao INTEGER NOT NULL,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  pontuacao DECIMAL(10,2),
  visitas INTEGER,
  cliques_whatsapp INTEGER,
  nota_media DECIMAL(3,1),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS ultimo_ranking JSONB;

-- 3. CHECK-INS
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  sessao_id TEXT NOT NULL,
  ip_hash TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS checkins_mes_atual INTEGER DEFAULT 0;

-- 4. PÁGINAS CATEGORIA × CIDADE (SEO)
CREATE TABLE IF NOT EXISTS public.paginas_categoria_cidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id UUID NOT NULL REFERENCES public.cidades(id),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id),
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  conteudo_html TEXT,
  seo_titulo TEXT,
  seo_descricao TEXT,
  publicada BOOLEAN DEFAULT false,
  visualizacoes INTEGER DEFAULT 0,
  gerada_em TIMESTAMPTZ,
  UNIQUE(cidade_id, categoria_id)
);

-- 5. EVENTOS LOCAIS
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  parceiro_id UUID NOT NULL REFERENCES public.parceiros(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  local TEXT,
  imagem_url TEXT,
  link_externo TEXT,
  slug TEXT UNIQUE NOT NULL,
  publicado BOOLEAN DEFAULT false,
  seo_titulo TEXT,
  seo_descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RELATÓRIOS MENSAIS (RESEND)
CREATE TABLE IF NOT EXISTS public.relatorios_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  mes_referencia TEXT NOT NULL,
  email_enviado TEXT NOT NULL,
  assunto TEXT,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  aberto BOOLEAN DEFAULT false,
  erro TEXT
);

-- (Tabelas adicionais do checklist)
CREATE TABLE IF NOT EXISTS public.config_leads_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preco_clique DECIMAL(10,2) DEFAULT 0.50,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.creditos_parceiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id UUID NOT NULL REFERENCES public.parceiros(id),
  saldo DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id UUID NOT NULL REFERENCES public.parceiros(id),
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS percentual_comissao INTEGER DEFAULT 30;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS google_place_id TEXT;
