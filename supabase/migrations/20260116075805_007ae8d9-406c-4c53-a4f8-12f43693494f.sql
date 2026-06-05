-- =============================================
-- GUIA LOCAL BR - MIGRAÇÃO COMPLETA DO BANCO
-- =============================================

-- 1. Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'parceiro', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Inserir perfil no cadastro"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Tabela de parceiros
CREATE TABLE public.parceiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  data_adicao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

-- Políticas para parceiros (apenas admin pode gerenciar)
CREATE POLICY "Apenas admin pode ver parceiros"
  ON public.parceiros FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Apenas admin pode inserir parceiros"
  ON public.parceiros FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Apenas admin pode deletar parceiros"
  ON public.parceiros FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Tabela de empresas
CREATE TABLE public.empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users ON DELETE SET NULL,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  telefone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  foto_principal TEXT,
  fotos_adicionais TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  site TEXT,
  nicho TEXT,
  horario TEXT,
  descricao TEXT,
  plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'premium')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  destaque_banner BOOLEAN DEFAULT FALSE,
  destaque_rotacao BOOLEAN DEFAULT FALSE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas
CREATE POLICY "Empresas aprovadas são públicas"
  ON public.empresas FOR SELECT
  USING (status = 'aprovado' OR auth.uid() = usuario_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Usuários autenticados podem cadastrar empresas"
  ON public.empresas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar suas próprias empresas"
  ON public.empresas FOR UPDATE
  USING (auth.uid() = usuario_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Apenas admin pode deletar empresas"
  ON public.empresas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Tabela de analytics
CREATE TABLE public.analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('page_view', 'click_empresa', 'click_whatsapp', 'click_telefone', 'click_site')),
  empresa_id UUID REFERENCES public.empresas ON DELETE SET NULL,
  pagina TEXT,
  cidade_usuario TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics
CREATE POLICY "Qualquer um pode inserir analytics"
  ON public.analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Apenas admin pode ver analytics"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Bucket de storage para imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'empresas',
  'empresas',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Políticas de storage
CREATE POLICY "Imagens de empresas são públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'empresas');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empresas' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar suas próprias imagens"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empresas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Índices para performance
CREATE INDEX idx_empresas_cidade ON public.empresas(cidade);
CREATE INDEX idx_empresas_estado ON public.empresas(estado);
CREATE INDEX idx_empresas_nicho ON public.empresas(nicho);
CREATE INDEX idx_empresas_plano ON public.empresas(plano);
CREATE INDEX idx_empresas_status ON public.empresas(status);
CREATE INDEX idx_empresas_destaque_banner ON public.empresas(destaque_banner) WHERE destaque_banner = true;
CREATE INDEX idx_empresas_destaque_rotacao ON public.empresas(destaque_rotacao) WHERE destaque_rotacao = true;
CREATE INDEX idx_analytics_tipo_evento ON public.analytics(tipo_evento);
CREATE INDEX idx_analytics_data_hora ON public.analytics(data_hora);
CREATE INDEX idx_analytics_empresa_id ON public.analytics(empresa_id);

-- 7. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();