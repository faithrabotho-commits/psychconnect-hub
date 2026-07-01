
-- 1) Organisations: keep public read but hide contact_email from anon (and unauthenticated Data API)
REVOKE SELECT (contact_email) ON public.organisations FROM anon;
REVOKE SELECT (contact_email) ON public.organisations FROM authenticated;
GRANT SELECT (contact_email) ON public.organisations TO authenticated;
-- service_role retains ALL

-- 2) Psychologist details: restrict SELECT to owner or admin
DROP POLICY IF EXISTS psych_public_read ON public.psychologist_details;
CREATE POLICY psych_owner_or_admin_read ON public.psychologist_details
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
