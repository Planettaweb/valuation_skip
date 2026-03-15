-- Standardize grants for authenticated users to avoid 403 Forbidden errors
GRANT ALL ON public.documents TO authenticated;
GRANT ALL ON public.document_rows TO authenticated;
GRANT ALL ON public.financial_balancete TO authenticated;
GRANT ALL ON public.financial_balanco_patrimonial TO authenticated;
GRANT ALL ON public.financial_dre TO authenticated;
GRANT ALL ON public.financial_fluxo_caixa TO authenticated;

-- Drop existing restrictive policies to replace them with consistent testing ones as requested
DROP POLICY IF EXISTS "documents_select_own_org" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_update" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
DROP POLICY IF EXISTS "tenant_isolation_document_rows_select" ON public.document_rows;

-- Create bypass RLS policies for testing as per acceptance criteria
CREATE POLICY "bypass_rls_for_testing" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bypass_rls_rows_testing" ON public.document_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);
