-- Drop the existing foreign key constraint that lacks ON DELETE CASCADE
ALTER TABLE public.document_rows 
DROP CONSTRAINT IF EXISTS document_rows_document_id_fkey;

-- Re-create the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.document_rows 
ADD CONSTRAINT document_rows_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES public.documents(id) 
ON DELETE CASCADE;
