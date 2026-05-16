-- Ensure standard permissions are granted to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embedded_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.embedded_reports TO service_role;

DO $$
BEGIN
  -- Drop the restrictive policy and replace with a standard tenant isolation policy
  DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_select" ON public.embedded_reports;

  CREATE POLICY "tenant_isolation_embedded_reports_select" ON public.embedded_reports
    FOR SELECT TO authenticated
    USING (org_id = get_user_org_id());
END $$;
