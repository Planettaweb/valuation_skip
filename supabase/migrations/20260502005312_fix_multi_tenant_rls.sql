-- Fix multi-tenant architecture for processamento_pdf, valuation_projects and kb_documents

-- 1. processamento_pdf
ALTER TABLE public.processamento_pdf ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Drop insecure policies that were fully permissive
DROP POLICY IF EXISTS "authenticated_delete_processamento_pdf" ON public.processamento_pdf;
DROP POLICY IF EXISTS "authenticated_insert_processamento_pdf" ON public.processamento_pdf;
DROP POLICY IF EXISTS "authenticated_select_processamento_pdf" ON public.processamento_pdf;
DROP POLICY IF EXISTS "authenticated_update_processamento_pdf" ON public.processamento_pdf;

-- Create secure multi-tenant policies
DROP POLICY IF EXISTS "tenant_isolation_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "tenant_isolation_processamento_pdf" ON public.processamento_pdf
  FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());

DROP POLICY IF EXISTS "admin_all_access_processamento_pdf" ON public.processamento_pdf;
CREATE POLICY "admin_all_access_processamento_pdf" ON public.processamento_pdf
  FOR ALL TO authenticated USING (public.get_user_role_name() = 'Admin') WITH CHECK (public.get_user_role_name() = 'Admin');

-- 2. valuation_projects
-- Replace current_setting with get_user_org_id()
DROP POLICY IF EXISTS "valuation_projects_select_own_org" ON public.valuation_projects;
DROP POLICY IF EXISTS "tenant_isolation_valuation_projects" ON public.valuation_projects;

CREATE POLICY "tenant_isolation_valuation_projects" ON public.valuation_projects
  FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());

-- 3. kb_documents
ALTER TABLE public.kb_documents ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "tenant_isolation_kb_documents" ON public.kb_documents;
CREATE POLICY "tenant_isolation_kb_documents" ON public.kb_documents
  FOR ALL TO authenticated USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());

-- Ensure RLS is enabled on these tables
ALTER TABLE public.processamento_pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
