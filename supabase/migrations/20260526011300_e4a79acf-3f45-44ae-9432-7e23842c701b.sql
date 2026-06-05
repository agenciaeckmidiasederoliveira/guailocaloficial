-- 1. Helper unaccent simples (sem extensão) — criar primeiro pois outras funções dependem dele
CREATE OR REPLACE FUNCTION public.unaccent_simple(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(coalesce(t,''),
    'áàâãäåāăąéèêëēĕėęěíìîïīĭįóòôõöøōŏőúùûüūŭůűųçćĉċčñńÁÀÂÃÄÅĀĂĄÉÈÊËĒĔĖĘĚÍÌÎÏĪĬĮÓÒÔÕÖØŌŎŐÚÙÛÜŪŬŮŰŲÇĆĈĊČÑŃ',
    'aaaaaaaaaeeeeeeeeeiiiiiiiooooooooouuuuuuuuuccccccnnAAAAAAAAAEEEEEEEEEIIIIIIIOOOOOOOOOUUUUUUUUUCCCCCCNN');
$$;

-- 2. Novos campos em parceiros
ALTER TABLE public.parceiros
  ADD COLUMN IF NOT EXISTS cidades_atendidas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- 3. Slug auto-gerado
CREATE OR REPLACE FUNCTION public.set_parceiro_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text; candidate text; i int := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(public.unaccent_simple(coalesce(NULLIF(NEW.nome, ''), split_part(NEW.email, '@', 1))));
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := regexp_replace(base, '^-|-$', '', 'g');
    IF base = '' THEN base := 'parceiro'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.parceiros WHERE slug = candidate AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      i := i + 1;
      candidate := base || '-' || i;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_parceiro_slug ON public.parceiros;
CREATE TRIGGER trg_set_parceiro_slug
  BEFORE INSERT OR UPDATE OF nome, slug ON public.parceiros
  FOR EACH ROW EXECUTE FUNCTION public.set_parceiro_slug();

-- Backfill slugs existentes
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.parceiros WHERE slug IS NULL LOOP
    UPDATE public.parceiros SET slug = NULL WHERE id = r.id;
    UPDATE public.parceiros SET nome = nome WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Parceiro por slug (público, sem expor email)
CREATE OR REPLACE FUNCTION public.get_parceiro_por_slug(p_slug text)
RETURNS TABLE(
  id uuid, nome text, nivel text, bio text, avatar_url text,
  whatsapp text, slug text, cidades_atendidas jsonb, total_empresas bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)),
    p.nivel, p.bio, p.avatar_url, p.whatsapp, p.slug, p.cidades_atendidas,
    (SELECT COUNT(*) FROM public.empresas e
       JOIN public.profiles pr ON pr.id = e.usuario_id
       WHERE pr.email = p.email AND e.status = 'aprovado')::bigint
  FROM public.parceiros p WHERE p.slug = p_slug LIMIT 1;
$$;

-- 5. Empresas das cidades atendidas pelo parceiro logado
CREATE OR REPLACE FUNCTION public.get_empresas_das_minhas_cidades()
RETURNS SETOF public.empresas
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.* FROM public.empresas e
  WHERE e.status = 'aprovado'
    AND EXISTS (
      SELECT 1 FROM public.parceiros p,
           jsonb_array_elements(p.cidades_atendidas) AS c
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND lower(public.unaccent_simple(c->>'cidade')) = lower(public.unaccent_simple(e.cidade))
        AND upper(c->>'estado') = upper(e.estado)
    )
  ORDER BY e.plano DESC, e.data_cadastro DESC;
$$;

-- 6. Parceiro local responsável por uma cidade (público)
CREATE OR REPLACE FUNCTION public.get_parceiro_local_por_cidade(p_estado text, p_cidade text)
RETURNS TABLE(id uuid, nome text, slug text, nivel text, whatsapp text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)),
    p.slug, p.nivel, p.whatsapp, p.avatar_url
  FROM public.parceiros p, jsonb_array_elements(p.cidades_atendidas) AS c
  WHERE upper(c->>'estado') = upper(p_estado)
    AND lower(public.unaccent_simple(c->>'cidade')) = lower(public.unaccent_simple(p_cidade))
  ORDER BY p.data_adicao ASC LIMIT 1;
$$;

-- 7. Analytics agregada por parceiro (apenas admin)
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
    COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)),
    p.email, p.nivel, p.slug,
    jsonb_array_length(p.cidades_atendidas),
    COUNT(DISTINCT e.id),
    COUNT(DISTINCT e.id) FILTER (WHERE e.plano = 'premium'),
    COUNT(DISTINCT e.id) FILTER (WHERE e.plano = 'free'),
    COUNT(a.id) FILTER (WHERE a.tipo_evento = 'page_view'),
    COUNT(a.id) FILTER (WHERE a.tipo_evento = 'click_whatsapp'),
    COUNT(a.id) FILTER (WHERE a.tipo_evento = 'click_telefone'),
    COALESCE(SUM(pg.valor) FILTER (WHERE pg.status IN ('CONFIRMED','RECEIVED','pago')), 0),
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.status IN ('CONFIRMED','RECEIVED','pago'))
  FROM public.parceiros p
  LEFT JOIN public.profiles pr ON pr.email = p.email
  LEFT JOIN public.empresas e ON e.usuario_id = pr.id AND e.status = 'aprovado'
  LEFT JOIN public.analytics a ON a.empresa_id = e.id
  LEFT JOIN public.pagamentos pg ON pg.user_id = pr.id
  WHERE has_role(auth.uid(), 'admin'::app_role)
  GROUP BY p.id, p.nome, p.email, p.nivel, p.slug, p.cidades_atendidas
  ORDER BY COUNT(DISTINCT e.id) DESC;
$$;