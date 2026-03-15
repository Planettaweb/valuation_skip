-- Update RLS policy for document_rows to ensure the authenticated user can query records for their organization
DROP POLICY IF EXISTS "tenant_isolation_document_rows" ON public.document_rows;

CREATE POLICY "tenant_isolation_document_rows" ON public.document_rows 
FOR ALL TO authenticated USING (
  org_id = public.get_user_org_id()
);
