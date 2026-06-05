CREATE OR REPLACE FUNCTION public.get_parceiros_ranking()
 RETURNS TABLE(id uuid, nome text, nivel text, total_empresas bigint, total_premium bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH parceiro_stats AS (
    SELECT
      p.id,
      COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)) AS nome_display,
      p.nivel,
      p.data_adicao,
      COUNT(e.id) AS total_empresas,
      COUNT(e.id) FILTER (WHERE e.plano = 'premium') AS total_premium
    FROM public.parceiros p
    LEFT JOIN public.profiles pr ON pr.email = p.email
    LEFT JOIN public.empresas e ON e.usuario_id = pr.id AND e.status = 'aprovado'
    WHERE p.email <> ''
    GROUP BY p.id, p.nome, p.email, p.nivel, p.data_adicao
  ),
  grouped AS (
    SELECT
      lower(trim(nome_display)) AS nome_key,
      (array_agg(id ORDER BY data_adicao ASC))[1] AS id,
      (array_agg(nome_display ORDER BY data_adicao ASC))[1] AS nome,
      (array_agg(nivel ORDER BY
        CASE nivel WHEN 'diamante' THEN 1 WHEN 'ouro' THEN 2 WHEN 'prata' THEN 3 ELSE 4 END
      ))[1] AS nivel,
      SUM(total_empresas) AS total_empresas,
      SUM(total_premium) AS total_premium
    FROM parceiro_stats
    GROUP BY lower(trim(nome_display))
  )
  SELECT id, nome, nivel, total_empresas, total_premium
  FROM grouped
  WHERE total_empresas > 0
  ORDER BY total_empresas DESC, total_premium DESC
  LIMIT 20;
$function$;