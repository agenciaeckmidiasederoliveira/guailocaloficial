
-- Create avaliacoes table
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nota integer NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, user_id)
);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Avaliacoes publicas para leitura"
ON public.avaliacoes FOR SELECT
USING (true);

-- Authenticated users can insert their own
CREATE POLICY "Usuarios podem criar avaliacoes"
ON public.avaliacoes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "Usuarios podem editar suas avaliacoes"
ON public.avaliacoes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own, admins can delete any
CREATE POLICY "Usuarios podem deletar suas avaliacoes"
ON public.avaliacoes FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_avaliacoes_updated_at
BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast queries
CREATE INDEX idx_avaliacoes_empresa_id ON public.avaliacoes(empresa_id);
CREATE INDEX idx_avaliacoes_user_id ON public.avaliacoes(user_id);
