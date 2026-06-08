-- =========================================================================
-- SCRIPT DE LIMPEZA: EXCLUIR CONTAS GRATUITAS APÓS 12 MESES
-- =========================================================================

-- Opção 1: Executar manualmente na aba SQL do Supabase
DELETE FROM public.empresas 
WHERE (plano = 'gratuito' OR plano = 'free' OR plano IS NULL) 
AND criado_em < NOW() - INTERVAL '12 months';

-- Opção 2: Agendar a execução automática diária (Requer pg_cron ativado)
-- (Pode ser executado diretamente no Supabase, aba SQL)
/*
SELECT cron.schedule(
  'limpar_gratuitos_vencidos',
  '0 0 * * *',  -- Executa todos os dias à meia noite
  $$
    DELETE FROM public.empresas 
    WHERE (plano = 'gratuito' OR plano = 'free' OR plano IS NULL) 
    AND criado_em < NOW() - INTERVAL '12 months';
  $$
);
*/
