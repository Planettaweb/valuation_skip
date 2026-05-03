DO $$
BEGIN
  -- add client_id to documents
  ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
  
  -- add client_id to financial_documents
  ALTER TABLE public.financial_documents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

  -- add client_id to financial data tables
  ALTER TABLE public.financial_balancete ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
  ALTER TABLE public.financial_balanco_patrimonial ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
  ALTER TABLE public.financial_data ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
  ALTER TABLE public.financial_dre ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
  ALTER TABLE public.financial_fluxo_caixa ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

  -- Backfill financial_documents
  UPDATE public.financial_documents fd
  SET client_id = v.client_id
  FROM public.valuations v
  WHERE fd.valuation_id = v.id AND fd.client_id IS NULL;

  -- Backfill documents
  UPDATE public.documents d
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE d.id = fd.id AND d.client_id IS NULL;

  -- Backfill financial data tables
  UPDATE public.financial_balancete f
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE f.document_id = fd.id AND f.client_id IS NULL;

  UPDATE public.financial_balanco_patrimonial f
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE f.document_id = fd.id AND f.client_id IS NULL;

  UPDATE public.financial_data f
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE f.document_id = fd.id AND f.client_id IS NULL;

  UPDATE public.financial_dre f
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE f.document_id = fd.id AND f.client_id IS NULL;

  UPDATE public.financial_fluxo_caixa f
  SET client_id = fd.client_id
  FROM public.financial_documents fd
  WHERE f.document_id = fd.id AND f.client_id IS NULL;

END $$;
