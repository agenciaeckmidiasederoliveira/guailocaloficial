-- ============================================================
-- RODA ISSO NO SQL EDITOR DO SEU SUPABASE AGORA
-- app.supabase.com → SQL Editor → New Query → Run
-- ============================================================

-- 1. Criar a tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  role TEXT DEFAULT 'empresa_gratis',
  avatar_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Desativar RLS temporariamente para inserir
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Inserir o usuário admin (Eder)
INSERT INTO public.profiles (id, email, nome, role)
VALUES (
  '6981d043-d817-4ed6-b061-a4b4847201dd',
  'gestorederoliveira@gmail.com',
  'Eder Oliveira',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  nome = 'Eder Oliveira',
  email = 'gestorederoliveira@gmail.com';

-- 4. Verificar se inseriu corretamente
SELECT * FROM public.profiles WHERE id = '6981d043-d817-4ed6-b061-a4b4847201dd';

-- 5. Criar trigger para novos usuários (para não precisar fazer isso de novo)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'empresa_gratis')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Reativar RLS com políticas corretas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Qualquer usuário logado pode ver seu próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

-- Admin pode ver todos
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Usuário pode atualizar o próprio perfil
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Insert pelo trigger (service role)
CREATE POLICY "profiles_insert_trigger" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 7. Inserir Julio Domingo também (se já existe no Auth)
-- Primeiro veja se ele existe:
SELECT id, email FROM auth.users WHERE email = 'ojulio.domingos@gmail.com';
-- Se retornar um UUID, rode isso substituindo o UUID:
-- INSERT INTO public.profiles (id, email, nome, role)
-- VALUES ('UUID_DO_JULIO', 'ojulio.domingos@gmail.com', 'Julio Domingo', 'parceiro_master')
-- ON CONFLICT (id) DO UPDATE SET role = 'parceiro_master', nome = 'Julio Domingo';
