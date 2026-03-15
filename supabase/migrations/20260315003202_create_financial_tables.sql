-- Add document_type to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type character varying;
ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT 'Uploaded'::character varying;

-- Table: financial_balanco_patrimonial
CREATE TABLE public.financial_balanco_patrimonial (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    classification_code character varying,
    description text,
    value_year_n numeric,
    value_year_n_minus_1 numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: financial_dre
CREATE TABLE public.financial_dre (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    description text,
    balance numeric,
    sum numeric,
    total numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: financial_balancete
CREATE TABLE public.financial_balancete (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    classification_code character varying,
    account_description text,
    previous_balance numeric,
    debit numeric,
    credit numeric,
    current_balance numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: financial_fluxo_caixa
CREATE TABLE public.financial_fluxo_caixa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    description text,
    value numeric,
    period character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.financial_balanco_patrimonial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_bp" ON public.financial_balanco_patrimonial FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.financial_dre ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_dre" ON public.financial_dre FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.financial_balancete ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_balancete" ON public.financial_balancete FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.financial_fluxo_caixa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_fc" ON public.financial_fluxo_caixa FOR ALL TO authenticated USING (org_id = public.get_user_org_id());
