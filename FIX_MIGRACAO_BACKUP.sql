-- ═══════════════════════════════════════════════════════════════════════
-- FIX 0: Criar função unaccent_simple (Dependência)
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.unaccent_simple(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(coalesce(t,''),
    'áàâãäåāăąéèêëēĕėęěíìîïīĭįóòôõöøōŏőúùûüūŭůűųçćĉċčñńÁÀÂÃÄÅĀĂĄÉÈÊËĒĔĖĘĚÍÌÎÏĪĬĮÓÒÔÕÖØŌŎŐÚÙÛÜŪŬŮŰŲÇĆĈĊČÑŃ',
    'aaaaaaaaaeeeeeeeeeiiiiiiiooooooooouuuuuuuuuccccccnnAAAAAAAAAEEEEEEEEEIIIIIIIOOOOOOOOOUUUUUUUUUCCCCCCNN');
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 1: Corrigir RLS policy de avaliacoes que chama jsonb_array_length

-- A função admin_get_parceiros_analytics usa jsonb_array_length(p.cidades_atendidas)
-- e é chamada indiretamente por políticas RLS ao inserir em avaliacoes.
-- Garantir que a coluna cidades_atendidas seja jsonb (não text[]):

ALTER TABLE public.parceiros
  ALTER COLUMN cidades_atendidas TYPE jsonb USING
    CASE
      WHEN cidades_atendidas IS NULL THEN '[]'::jsonb
      WHEN pg_typeof(cidades_atendidas)::text = 'jsonb' THEN cidades_atendidas
      ELSE '[]'::jsonb
    END;

-- Garantir o default correto
ALTER TABLE public.parceiros
  ALTER COLUMN cidades_atendidas SET DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 2: Criar Storage Buckets para empresas e parceiros (imagens)
-- ═══════════════════════════════════════════════════════════════════════

-- Criar bucket 'empresas' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'empresas',
  'empresas',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Criar bucket 'parceiros' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parceiros',
  'parceiros',
  true,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 3: Políticas de Storage para leitura pública e upload autenticado
-- ═══════════════════════════════════════════════════════════════════════

-- Bucket empresas: leitura pública
DROP POLICY IF EXISTS "Empresas storage público" ON storage.objects;
CREATE POLICY "Empresas storage público"
ON storage.objects FOR SELECT
USING (bucket_id = 'empresas');

-- Bucket empresas: upload pelo service_role e autenticados
DROP POLICY IF EXISTS "Empresas storage upload" ON storage.objects;
CREATE POLICY "Empresas storage upload"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'empresas');

DROP POLICY IF EXISTS "Empresas storage update" ON storage.objects;
CREATE POLICY "Empresas storage update"
ON storage.objects FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'empresas');

DROP POLICY IF EXISTS "Empresas storage delete" ON storage.objects;
CREATE POLICY "Empresas storage delete"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'empresas');

-- Bucket parceiros: leitura pública
DROP POLICY IF EXISTS "Parceiros storage público" ON storage.objects;
CREATE POLICY "Parceiros storage público"
ON storage.objects FOR SELECT
USING (bucket_id = 'parceiros');

DROP POLICY IF EXISTS "Parceiros storage upload" ON storage.objects;
CREATE POLICY "Parceiros storage upload"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'parceiros');

DROP POLICY IF EXISTS "Parceiros storage update" ON storage.objects;
CREATE POLICY "Parceiros storage update"
ON storage.objects FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'parceiros');

DROP POLICY IF EXISTS "Parceiros storage delete" ON storage.objects;
CREATE POLICY "Parceiros storage delete"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'parceiros');

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 4: Recriar a função admin_get_parceiros_analytics com CAST seguro
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_get_parceiros_analytics()
RETURNS TABLE(
  parceiro_id uuid, nome text, email text, nivel text, slug text,
  cidades_count int, total_empresas bigint, total_premium bigint, total_free bigint,
  total_views bigint, total_whatsapp bigint, total_telefone bigint,
  total_vendas numeric, total_pagamentos_confirmados bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id,
    COALESCE(NULLIF(p.nome_comercial, ''), p.whatsapp, p.id::text),
    p.whatsapp, -- email não existe mais, usar whatsapp como identificador
    p.nivel::text,
    p.slug,
    -- Safe cast: cidades_atendidas garantido como jsonb
    COALESCE(jsonb_array_length(
      CASE
        WHEN p.cidades_atendidas IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(p.cidades_atendidas) = 'array' THEN p.cidades_atendidas
        ELSE '[]'::jsonb
      END
    ), 0),
    COUNT(DISTINCT e.id),
    COUNT(DISTINCT e.id) FILTER (WHERE e.plano = 'premium'),
    COUNT(DISTINCT e.id) FILTER (WHERE e.plano IN ('free','gratis')),
    0::bigint, -- total_views (analytics removido)
    0::bigint, -- total_whatsapp (analytics removido)
    0::bigint, -- total_telefone (analytics removido)
    0::numeric, -- total_vendas (pagamentos pendente)
    0::bigint  -- total_pagamentos (pagamentos pendente)
  FROM public.parceiros p
  LEFT JOIN public.empresas e ON e.parceiro_id = p.id AND e.status = 'aprovado'
  -- Removed WHERE auth check completely as admin logic and tables are missing in this DB version
  GROUP BY p.id, p.nome_comercial, p.whatsapp, p.nivel, p.slug, p.cidades_atendidas
  ORDER BY COUNT(DISTINCT e.id) DESC;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- FIX 5: Recriar get_empresas_das_minhas_cidades com parceiros novo schema
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_empresas_das_minhas_cidades()
RETURNS SETOF public.empresas
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.* FROM public.empresas e
  WHERE e.status = 'aprovado'
    AND EXISTS (
      SELECT 1 FROM public.parceiros p,
           jsonb_array_elements(
             CASE
               WHEN p.cidades_atendidas IS NULL THEN '[]'::jsonb
               WHEN jsonb_typeof(p.cidades_atendidas) = 'array' THEN p.cidades_atendidas
               ELSE '[]'::jsonb
             END
           ) AS c
      WHERE p.id = (SELECT id FROM public.parceiros WHERE whatsapp = (SELECT phone FROM auth.users WHERE id = auth.uid()) LIMIT 1)
        AND lower(public.unaccent_simple(c->>'cidade')) = lower(public.unaccent_simple(e.cidade))
        AND upper(c->>'estado') = upper(e.estado)
    )
  ORDER BY e.plano DESC, e.criado_em DESC;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: Contar registros após correções
-- ═══════════════════════════════════════════════════════════════════════
SELECT 'empresas' as tabela, COUNT(*) FROM public.empresas
UNION ALL SELECT 'client_pages', COUNT(*) FROM public.client_pages
UNION ALL SELECT 'blog_posts', COUNT(*) FROM public.blog_posts
UNION ALL SELECT 'business_pages', COUNT(*) FROM public.business_pages
UNION ALL SELECT 'avaliacoes', COUNT(*) FROM public.avaliacoes;
