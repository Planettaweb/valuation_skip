-- Fix RLS permissions for documents table to allow all authenticated users within the same org to upload
DROP POLICY IF EXISTS "documents_insert" ON public.documents;

CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (
  org_id = public.get_user_org_id()
);
