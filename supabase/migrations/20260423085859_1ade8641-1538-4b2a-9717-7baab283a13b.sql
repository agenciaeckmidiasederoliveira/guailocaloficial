
-- Sincroniza user_roles com o profile correto
WITH u AS (
  SELECT id FROM public.profiles WHERE lower(email) = 'ziptemperos@gmail.com'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'parceiro'::public.app_role FROM u
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM public.profiles WHERE lower(email) = 'ziptemperos@gmail.com')
  AND role = 'user'::public.app_role;
