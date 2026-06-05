
-- Overview agregada para o painel admin
CREATE OR REPLACE FUNCTION public.admin_get_parceiros_overview()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_parceiros', (SELECT COUNT(*) FROM public.parceiros WHERE email <> ''),
    'total_empresas', (SELECT COUNT(*) FROM public.empresas WHERE status='aprovado'),
    'total_premium', (SELECT COUNT(*) FROM public.empresas WHERE status='aprovado' AND plano='premium'),
    'total_views', (SELECT COUNT(*) FROM public.analytics WHERE tipo_evento='page_view'),
    'total_whatsapp', (SELECT COUNT(*) FROM public.analytics WHERE tipo_evento='click_whatsapp'),
    'total_vendas', (SELECT COALESCE(SUM(valor),0) FROM public.pagamentos WHERE status IN ('CONFIRMED','RECEIVED','pago')),
    'novos_30d', (SELECT COUNT(*) FROM public.empresas WHERE status='aprovado' AND data_cadastro >= now() - interval '30 days')
  )
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;

-- Detalhe profundo por parceiro
CREATE OR REPLACE FUNCTION public.admin_get_parceiro_detalhe(p_parceiro_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT email INTO v_email FROM public.parceiros WHERE id = p_parceiro_id;
  IF v_email IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'parceiro', (
      SELECT to_jsonb(p) FROM public.parceiros p WHERE p.id = p_parceiro_id
    ),
    'kpis', (
      SELECT jsonb_build_object(
        'total_empresas', COUNT(*),
        'premium', COUNT(*) FILTER (WHERE plano='premium'),
        'free', COUNT(*) FILTER (WHERE plano='free'),
        'pendentes', COUNT(*) FILTER (WHERE status='pendente'),
        'rejeitados', COUNT(*) FILTER (WHERE status='rejeitado'),
        'aprovadas', COUNT(*) FILTER (WHERE status='aprovado'),
        'novas_30d', COUNT(*) FILTER (WHERE status='aprovado' AND data_cadastro >= now() - interval '30 days')
      )
      FROM public.empresas e
      JOIN public.profiles pr ON pr.id = e.usuario_id
      WHERE pr.email = v_email
    ),
    'eventos', (
      SELECT jsonb_build_object(
        'views', COUNT(*) FILTER (WHERE a.tipo_evento='page_view'),
        'whatsapp', COUNT(*) FILTER (WHERE a.tipo_evento='click_whatsapp'),
        'telefone', COUNT(*) FILTER (WHERE a.tipo_evento='click_telefone'),
        'site', COUNT(*) FILTER (WHERE a.tipo_evento='click_site'),
        'favoritos', COUNT(*) FILTER (WHERE a.tipo_evento='favorito_add'),
        'shares', COUNT(*) FILTER (WHERE a.tipo_evento='share')
      )
      FROM public.analytics a
      WHERE a.empresa_id IN (
        SELECT e.id FROM public.empresas e
        JOIN public.profiles pr ON pr.id = e.usuario_id
        WHERE pr.email = v_email
      )
    ),
    'timeline_30d', (
      SELECT COALESCE(jsonb_agg(t ORDER BY t.dia), '[]'::jsonb)
      FROM (
        SELECT
          to_char(d::date, 'YYYY-MM-DD') AS dia,
          COUNT(a.id) FILTER (WHERE a.tipo_evento='page_view') AS views,
          COUNT(a.id) FILTER (WHERE a.tipo_evento='click_whatsapp') AS whatsapp
        FROM generate_series(now()::date - interval '29 days', now()::date, '1 day') d
        LEFT JOIN public.analytics a
          ON a.data_hora::date = d::date
          AND a.empresa_id IN (
            SELECT e.id FROM public.empresas e
            JOIN public.profiles pr ON pr.id = e.usuario_id
            WHERE pr.email = v_email
          )
        GROUP BY d
      ) t
    ),
    'top_empresas', (
      SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC), '[]'::jsonb)
      FROM (
        SELECT e.id, e.nome, e.slug, e.cidade, e.estado, e.plano, e.status,
          COUNT(a.id) FILTER (WHERE a.tipo_evento='page_view') AS views,
          COUNT(a.id) FILTER (WHERE a.tipo_evento='click_whatsapp') AS whatsapp,
          (CASE WHEN COUNT(a.id) FILTER (WHERE a.tipo_evento='page_view') > 0
             THEN ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.tipo_evento='click_whatsapp')
                        / COUNT(a.id) FILTER (WHERE a.tipo_evento='page_view'), 1)
             ELSE 0 END) AS conversao
        FROM public.empresas e
        JOIN public.profiles pr ON pr.id = e.usuario_id
        LEFT JOIN public.analytics a ON a.empresa_id = e.id
        WHERE pr.email = v_email
        GROUP BY e.id
        ORDER BY views DESC
        LIMIT 10
      ) x
    ),
    'cidades_breakdown', (
      SELECT COALESCE(jsonb_agg(x ORDER BY x.total DESC), '[]'::jsonb)
      FROM (
        SELECT e.cidade, e.estado, COUNT(*) AS total,
          COUNT(*) FILTER (WHERE e.plano='premium') AS premium
        FROM public.empresas e
        JOIN public.profiles pr ON pr.id = e.usuario_id
        WHERE pr.email = v_email AND e.status='aprovado'
        GROUP BY e.cidade, e.estado
      ) x
    ),
    'vendas', (
      SELECT jsonb_build_object(
        'total', COALESCE(SUM(valor) FILTER (WHERE status IN ('CONFIRMED','RECEIVED','pago')), 0),
        'pendente', COALESCE(SUM(valor) FILTER (WHERE status NOT IN ('CONFIRMED','RECEIVED','pago')), 0),
        'count_confirmados', COUNT(*) FILTER (WHERE status IN ('CONFIRMED','RECEIVED','pago')),
        'ultimos', COALESCE((
          SELECT jsonb_agg(p2 ORDER BY (p2->>'created_at') DESC)
          FROM (
            SELECT jsonb_build_object(
              'id', pg.id, 'valor', pg.valor, 'status', pg.status,
              'metodo', pg.metodo_pagamento, 'created_at', pg.created_at
            ) AS p2
            FROM public.pagamentos pg
            JOIN public.profiles pr2 ON pr2.id = pg.user_id
            WHERE pr2.email = v_email
            ORDER BY pg.created_at DESC LIMIT 10
          ) s
        ), '[]'::jsonb)
      )
      FROM public.pagamentos pg
      JOIN public.profiles pr ON pr.id = pg.user_id
      WHERE pr.email = v_email
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
