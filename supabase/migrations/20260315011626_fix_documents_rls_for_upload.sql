-- Fix RLS permissions for documents table to allow authenticated users to insert, checking user_id as requested
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (
  org_id = public.get_user_org_id() AND
  user_id = auth.uid()
);

-- Ensure SELECT works for document_rows explicitly for the tenant
DROP POLICY IF EXISTS "tenant_isolation_document_rows_select" ON public.document_rows;
CREATE POLICY "tenant_isolation_document_rows_select" ON public.document_rows FOR SELECT TO authenticated USING (
  org_id = public.get_user_org_id()
);
