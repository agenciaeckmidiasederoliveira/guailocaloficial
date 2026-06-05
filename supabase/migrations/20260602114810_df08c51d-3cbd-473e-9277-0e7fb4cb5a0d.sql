-- 1) Tabela tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome_cidade text NOT NULL,
  uf text NOT NULL,
  parceiro_id uuid NULL,
  dominio_customizado text NULL UNIQUE,
  subdominio text NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Grants (tenants é público para leitura — necessário para getTenantFromURL anônimo)
GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT ALL ON public.tenants TO service_role;

-- 3) RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants ativos sao publicos"
  ON public.tenants FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin gerencia tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Índices úteis
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdominio ON public.tenants(subdominio) WHERE subdominio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_dominio ON public.tenants(dominio_customizado) WHERE dominio_customizado IS NOT NULL;

-- 5) Coluna tenant_id em empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_tenant_id ON public.empresas(tenant_id) WHERE tenant_id IS NOT NULL;