-- ============================================================================
-- GUIA LOCAL BR - MIGRAÇÕES UNIFICADAS
-- Execute este script no SQL Editor do seu Supabase (app.supabase.com)
-- Seção: SQL Editor → New Query → Cole tudo e clique em Run (Executar)
-- ============================================================================

-- ============================================================================
-- 1. CORREÇÃO DE POLÍTICAS RLS (PROMPT 2)
-- ============================================================================

-- Garantir que a função is_admin() exista para otimizar e evitar recursão infinita
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Corrigir a política do profiles usando is_admin() para evitar recursão infinita
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- Adicionar colunas de destaque e foto_url na tabela cidades
ALTER TABLE public.cidades ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false;
ALTER TABLE public.cidades ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Admin vê todas as empresas
DROP POLICY IF EXISTS "admin_full_empresas" ON public.empresas;
CREATE POLICY "admin_full_empresas" ON public.empresas
FOR ALL TO authenticated
USING (public.is_admin());

-- Admin vê todas as cidades
DROP POLICY IF EXISTS "admin_full_cidades" ON public.cidades;
CREATE POLICY "admin_full_cidades" ON public.cidades
FOR ALL TO authenticated
USING (public.is_admin());

-- Público pode ler empresas ativas
DROP POLICY IF EXISTS "publico_empresas_ativas" ON public.empresas;
CREATE POLICY "publico_empresas_ativas" ON public.empresas
FOR SELECT TO anon, authenticated
USING (ativa = true);


-- ============================================================================
-- 2. SISTEMA DE LICENCIAMENTO POR CIDADE (PROMPT 3)
-- ============================================================================

-- Licenciados
CREATE TABLE IF NOT EXISTS public.licenciados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'cidade'
    CHECK (nivel IN ('cidade','regional','estadual','master')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  observacoes TEXT
);

-- Licenças (1 por cidade, bloqueio territorial garantido pelo UNIQUE)
CREATE TABLE IF NOT EXISTS public.licencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licenciado_id UUID NOT NULL REFERENCES public.licenciados(id) ON DELETE CASCADE,
  cidade_nome TEXT NOT NULL,
  estado_sigla CHAR(2) NOT NULL,
  cidade_slug TEXT NOT NULL,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE NOT NULL,
  valor_anual DECIMAL(10,2),
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  forma_pagamento TEXT,
  limite_premium INTEGER DEFAULT 50,
  limite_gratis INTEGER DEFAULT 200,
  status TEXT DEFAULT 'ativo'
    CHECK (status IN ('ativo','suspenso','vencido','cancelado')),
  UNIQUE(cidade_slug),  -- BLOQUEIO TERRITORIAL: 1 licenciado por cidade
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Vínculo empresa-licenciado
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS licenciado_id UUID REFERENCES public.licenciados(id) ON DELETE SET NULL;

-- Histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.licenca_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licenca_id UUID NOT NULL REFERENCES public.licencas(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  forma TEXT,
  comprovante_url TEXT,
  anotacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Licenciamento
ALTER TABLE public.licenciados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenca_pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_licenciados" ON public.licenciados;
CREATE POLICY "admin_licenciados" ON public.licenciados FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_licencas" ON public.licencas;
CREATE POLICY "admin_licencas" ON public.licencas FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_licenca_pagamentos" ON public.licenca_pagamentos;
CREATE POLICY "admin_licenca_pagamentos" ON public.licenca_pagamentos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "licenciado_proprio" ON public.licenciados;
CREATE POLICY "licenciado_proprio" ON public.licenciados FOR SELECT
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "licenciado_proprias_licencas" ON public.licencas;
CREATE POLICY "licenciado_proprias_licencas" ON public.licencas FOR SELECT
  USING (licenciado_id IN (SELECT id FROM public.licenciados WHERE profile_id = auth.uid()));


-- ============================================================================
-- 3. SISTEMA MULTI-DOMÍNIO REGIONAL (PROMPT 4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.dominios_regionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  cidade_slug TEXT,
  estado_sigla CHAR(2),
  cidades_slugs TEXT[],
  licenciado_id UUID REFERENCES public.licenciados(id) ON DELETE SET NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#2563EB',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Domínios Regionais
ALTER TABLE public.dominios_regionais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publico_ler_dominios" ON public.dominios_regionais;
CREATE POLICY "publico_ler_dominios" ON public.dominios_regionais FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "admin_all_dominios" ON public.dominios_regionais;
CREATE POLICY "admin_all_dominios" ON public.dominios_regionais FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inserir os domínios iniciais
INSERT INTO public.dominios_regionais (dominio, label) VALUES
  ('guialocalbr.com.br', 'Guia Local BR'),
  ('www.guialocalbr.com.br', 'Guia Local BR'),
  ('localhost', 'Guia Local BR (Local)')
ON CONFLICT (dominio) DO NOTHING;
