
-- 1. Profiles: restrict SELECT to owner; expose safe fields via public view
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, university, degree, grad_year, province
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow the view to actually return rows for anon/authenticated by adding a
-- broad-but-safe-columns SELECT policy: since the view uses security_invoker,
-- readers still need row access. Add a policy that permits reading the safe
-- columns implicitly by allowing SELECT to all — but we already restricted.
-- Instead, add a second policy so the view works:
CREATE POLICY profiles_public_display ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
-- Note: with two SELECT policies, either grants access. To prevent email leakage
-- we must remove this and rely on the view only. Drop it and instead grant the
-- view via a SECURITY DEFINER wrapper is complex; simpler: keep single owner
-- policy and have the view use SECURITY DEFINER semantics.
DROP POLICY profiles_public_display ON public.profiles;

-- Recreate the view as SECURITY DEFINER-equivalent by making it owned by a role
-- that bypasses RLS. Simpler approach: use a SECURITY DEFINER function to fetch.
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(id uuid, full_name text, avatar_url text, university text, degree text, grad_year int, province public.province)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, avatar_url, university, degree, grad_year, province
  FROM public.profiles WHERE id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO anon, authenticated;

-- 2. Certificates: require auth.uid() = user_id OR org admin issuing
DROP POLICY IF EXISTS certs_org_insert ON public.certificates;
CREATE POLICY certs_org_insert ON public.certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id)
    OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = certificates.org_id AND o.created_by = auth.uid()
    ))
  );

-- 3. Lock down handle_new_user - only trigger context should invoke it
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
