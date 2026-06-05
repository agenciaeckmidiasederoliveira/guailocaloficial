-- Avaliações anônimas: torna user_id opcional, adiciona nome do avaliador e flag de moderação
ALTER TABLE public.avaliacoes
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS nome_avaliador text,
  ADD COLUMN IF NOT EXISTS aprovado boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa_aprovado
  ON public.avaliacoes (empresa_id, aprovado, created_at DESC);

-- Refaz policies: leitura pública só do que está aprovado; admin vê tudo;
-- INSERT público sem login (anti-spam fica no client via localStorage).
DROP POLICY IF EXISTS "Avaliacoes publicas para leitura" ON public.avaliacoes;
DROP POLICY IF EXISTS "Usuarios podem criar avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Usuarios podem editar suas avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "Usuarios podem deletar suas avaliacoes" ON public.avaliacoes;

CREATE POLICY "Avaliacoes aprovadas sao publicas"
  ON public.avaliacoes FOR SELECT TO public
  USING (aprovado = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Qualquer um pode inserir avaliacao"
  ON public.avaliacoes FOR INSERT TO public
  WITH CHECK (
    nota BETWEEN 1 AND 5
    AND nome_avaliador IS NOT NULL
    AND length(trim(nome_avaliador)) BETWEEN 2 AND 80
    AND (comentario IS NULL OR length(comentario) <= 500)
  );

CREATE POLICY "Admin gerencia avaliacoes"
  ON public.avaliacoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));