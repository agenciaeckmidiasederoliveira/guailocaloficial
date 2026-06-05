
-- 1. PRIVILEGE_ESCALATION: Prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow only if the caller is admin (and not changing their own role unless admin)
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_update();

-- 2. EXPOSED_SENSITIVE_DATA: Restrict parceiros SELECT - remove the policy that allows users to see their full row including convite_token.
-- Users should use the get_my_parceiro_info() RPC which excludes convite_token.
DROP POLICY IF EXISTS "Usuarios verificam proprio email" ON public.parceiros;

-- 3. MISSING_RLS storage UPDATE on 'empresas' bucket - restrict to user's own folder
CREATE POLICY "Users can update own empresa files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'empresas'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'empresas'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
);

-- 4. SUPA_public_bucket_allows_listing: restrict listing on empresas bucket to authenticated users (still allow public read of individual files via getPublicUrl, but prevent enumeration)
-- Drop existing broad SELECT and add targeted one
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('Public Access', 'Empresas bucket public read', 'Allow public read on empresas')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Note: bucket marked public still serves files via CDN URL without listing.
-- We do NOT add a SELECT policy here to prevent enumeration; public URLs continue to work.

-- 5. REALTIME analytics: remove analytics from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'analytics'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.analytics';
  END IF;
END $$;

-- 6. SUPA_extension_in_public: move 'unaccent' extension out of public if installed there
-- Create dedicated schema and move
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'unaccent' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION unaccent SET SCHEMA extensions';
  END IF;
END $$;
