-- Inserir perfil de admin para gestorederoliveira@gmail.com
-- (será aplicado automaticamente quando o usuário se cadastrar com esse e-mail)

-- Criar função para verificar e definir admin
CREATE OR REPLACE FUNCTION public.check_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'gestorederoliveira@gmail.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para verificar admin no insert
CREATE TRIGGER check_admin_on_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_email();

-- Trigger para verificar admin no update
CREATE TRIGGER check_admin_on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_email();