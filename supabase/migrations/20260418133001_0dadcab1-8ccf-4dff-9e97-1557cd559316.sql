-- 1. Adicionar campos individuais ao parceiro
ALTER TABLE public.parceiros
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS nivel text NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS cota_premium integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS cota_free integer;

-- Constraint de níveis válidos
DO $$ BEGIN
  ALTER TABLE public.parceiros
    ADD CONSTRAINT parceiros_nivel_check
    CHECK (nivel IN ('bronze', 'prata', 'ouro', 'diamante'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Permitir UPDATE de parceiros pelo admin
DROP POLICY IF EXISTS "Apenas admin pode atualizar parceiros" ON public.parceiros;
CREATE POLICY "Apenas admin pode atualizar parceiros"
ON public.parceiros
FOR UPDATE
TO public
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- 3. Função pública de ranking (não expõe e-mail)
CREATE OR REPLACE FUNCTION public.get_parceiros_ranking()
RETURNS TABLE(
  id uuid,
  nome text,
  nivel text,
  total_empresas bigint,
  total_premium bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    COALESCE(NULLIF(p.nome, ''), split_part(p.email, '@', 1)) AS nome,
    p.nivel,
    COUNT(e.id) AS total_empresas,
    COUNT(e.id) FILTER (WHERE e.plano = 'premium') AS total_premium
  FROM public.parceiros p
  LEFT JOIN public.profiles pr ON pr.email = p.email
  LEFT JOIN public.empresas e ON e.usuario_id = pr.id AND e.status = 'aprovado'
  WHERE p.email <> ''
  GROUP BY p.id, p.nome, p.email, p.nivel
  HAVING COUNT(e.id) > 0
  ORDER BY total_empresas DESC, total_premium DESC
  LIMIT 20;
$$;

-- 4. Função para obter cotas do parceiro logado
CREATE OR REPLACE FUNCTION public.get_my_parceiro_info()
RETURNS TABLE(
  id uuid,
  nome text,
  nivel text,
  cota_premium integer,
  cota_free integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, nome, nivel, cota_premium, cota_free
  FROM public.parceiros
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1;
$$;