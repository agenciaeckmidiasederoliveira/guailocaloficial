-- Returns partner info (name, level) for a company, joining via the user that registered it.
-- Returns NULL row if no partner is associated.
CREATE OR REPLACE FUNCTION public.get_empresa_parceiro(p_empresa_id uuid)
RETURNS TABLE(nome text, nivel text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)) AS nome,
    p.nivel
  FROM public.empresas e
  JOIN public.profiles pr ON pr.id = e.usuario_id
  JOIN public.parceiros p ON p.email = pr.email
  WHERE e.id = p_empresa_id
    AND e.status = 'aprovado'
  LIMIT 1;
$function$;