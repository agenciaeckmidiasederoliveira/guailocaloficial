-- Criar tabela de favoritos
CREATE TABLE public.favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- Habilitar RLS
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios favoritos
CREATE POLICY "Usuarios podem ver seus proprios favoritos"
  ON public.favoritos FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem adicionar favoritos
CREATE POLICY "Usuarios podem adicionar favoritos"
  ON public.favoritos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem remover seus favoritos
CREATE POLICY "Usuarios podem deletar seus favoritos"
  ON public.favoritos FOR DELETE
  USING (auth.uid() = user_id);