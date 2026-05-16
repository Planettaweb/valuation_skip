CREATE TABLE IF NOT EXISTS public.embedded_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('dashboard', 'question')),
  resource_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.embedded_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_select" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_select" ON public.embedded_reports
  FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_insert" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_insert" ON public.embedded_reports
  FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_update" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_update" ON public.embedded_reports
  FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_delete" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_delete" ON public.embedded_reports
  FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_embedded_reports_org_id ON public.embedded_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_embedded_reports_client_id ON public.embedded_reports(client_id);
