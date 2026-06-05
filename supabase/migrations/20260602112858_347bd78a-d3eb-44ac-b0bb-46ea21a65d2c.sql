-- Estende a tabela analytics existente sem quebrar histórico
ALTER TABLE public.analytics
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS ip_hash text;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_empresa_id ON public.analytics(empresa_id);
CREATE INDEX IF NOT EXISTS idx_analytics_tipo_evento ON public.analytics(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_analytics_data_hora ON public.analytics(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_id ON public.analytics(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id) WHERE user_id IS NOT NULL;

-- Atualiza a policy de INSERT para aceitar novos tipos (mantendo os antigos)
DROP POLICY IF EXISTS "Qualquer pessoa pode inserir analytics" ON public.analytics;
CREATE POLICY "Qualquer pessoa pode inserir analytics"
ON public.analytics
FOR INSERT
TO public
WITH CHECK (
  tipo_evento = ANY (ARRAY[
    -- Tipos legados (mantidos)
    'page_view','click_empresa','click_whatsapp','click_telefone','click_site',
    'busca','favorito_add','favorito_remove','cadastro_inicio','cadastro_completo',
    'banner_click','share',
    -- Novos tipos solicitados
    'whatsapp_click','site_click','phone_click','foto_view','avaliacao_enviada'
  ])
);

-- Garante SELECT para o dono das empresas verem suas próprias estatísticas
DROP POLICY IF EXISTS "Dono ve analytics das suas empresas" ON public.analytics;
CREATE POLICY "Dono ve analytics das suas empresas"
ON public.analytics
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT id FROM public.empresas WHERE usuario_id = auth.uid()
  )
);