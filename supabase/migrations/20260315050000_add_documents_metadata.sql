-- Add metadata column to store extracted JSON directly in the document record
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Correct RLS SELECT policy to ensure users can read their newly uploaded documents immediately
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
CREATE POLICY "documents_select_policy" ON public.documents 
FOR SELECT TO authenticated 
USING (org_id = public.get_user_org_id());
