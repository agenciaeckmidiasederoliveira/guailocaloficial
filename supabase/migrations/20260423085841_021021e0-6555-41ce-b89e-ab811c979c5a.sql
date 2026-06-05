
DO $$
BEGIN
  -- Desabilita temporariamente o trigger de proteção, faz a atualização e reabilita
  ALTER TABLE public.profiles DISABLE TRIGGER USER;
  UPDATE public.profiles
  SET role = 'parceiro'
  WHERE lower(email) = 'ziptemperos@gmail.com'
    AND role = 'user';
  ALTER TABLE public.profiles ENABLE TRIGGER USER;
END$$;
