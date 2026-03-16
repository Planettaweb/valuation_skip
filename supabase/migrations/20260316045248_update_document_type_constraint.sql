ALTER TABLE public.financial_documents DROP CONSTRAINT IF EXISTS financial_documents_document_type_check;
ALTER TABLE public.financial_documents ADD CONSTRAINT financial_documents_document_type_check CHECK (document_type = ANY (ARRAY['Balanço'::text, 'Balanço Patrimonial'::text, 'Balancete'::text, 'DRE'::text, 'Fluxo de Caixa'::text]));

