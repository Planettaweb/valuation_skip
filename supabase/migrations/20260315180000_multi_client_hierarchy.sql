-- Create Multi-Client Hierarchy Tables
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    client_name text NOT NULL,
    cnpj text,
    industry text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.valuations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    valuation_type text CHECK (valuation_type IN ('Valuation', 'M&A')),
    valuation_name text NOT NULL,
    sharepoint_folder_path text,
    status text CHECK (status IN ('Em Andamento', 'Concluído')),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.financial_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    valuation_id uuid NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
    document_type text CHECK (document_type IN ('Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa')),
    file_name text NOT NULL,
    sharepoint_path text,
    file_path text,
    file_size integer,
    status text DEFAULT 'Processado',
    metadata jsonb,
    upload_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.financial_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid NOT NULL REFERENCES public.financial_documents(id) ON DELETE CASCADE,
    row_number integer,
    account_name text,
    value numeric,
    period text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and Create Policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_clients" ON public.clients FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_valuations" ON public.valuations FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.financial_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_financial_documents" ON public.financial_documents FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_financial_data" ON public.financial_data FOR ALL TO authenticated USING (org_id = public.get_user_org_id());

-- Data Migration Script to preserve existing data safely
DO $$
DECLARE
    v_vp record;
    v_client_id uuid;
    v_val_id uuid;
    v_doc record;
BEGIN
    -- 1. Migrate existing valuation_projects
    FOR v_vp IN SELECT * FROM public.valuation_projects LOOP
        SELECT id INTO v_client_id FROM public.clients WHERE org_id = v_vp.org_id AND client_name = v_vp.company_name LIMIT 1;
        
        IF v_client_id IS NULL THEN
            INSERT INTO public.clients (org_id, user_id, client_name, industry)
            VALUES (v_vp.org_id, v_vp.user_id, v_vp.company_name, 'Desconhecido')
            RETURNING id INTO v_client_id;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.valuations WHERE id = v_vp.id) THEN
            INSERT INTO public.valuations (id, org_id, client_id, valuation_type, valuation_name, status, created_at)
            VALUES (v_vp.id, v_vp.org_id, v_client_id, 'Valuation', v_vp.project_name, 
                CASE WHEN v_vp.status = 'draft' THEN 'Em Andamento' ELSE 'Concluído' END,
                COALESCE(v_vp.created_at, now())
            );
        END IF;
    END LOOP;

    -- 2. Migrate existing documents
    FOR v_doc IN SELECT * FROM public.documents LOOP
        v_val_id := v_doc.valuation_project_id;
        
        IF v_val_id IS NULL THEN
            SELECT id INTO v_client_id FROM public.clients WHERE org_id = v_doc.org_id AND client_name = 'Cliente Padrão' LIMIT 1;
            IF v_client_id IS NULL THEN
                INSERT INTO public.clients (org_id, user_id, client_name, industry)
                VALUES (v_doc.org_id, v_doc.user_id, 'Cliente Padrão', 'Geral')
                RETURNING id INTO v_client_id;
            END IF;

            SELECT id INTO v_val_id FROM public.valuations WHERE client_id = v_client_id AND valuation_name = 'Projeto Padrão' LIMIT 1;
            IF v_val_id IS NULL THEN
                INSERT INTO public.valuations (org_id, client_id, valuation_type, valuation_name, status)
                VALUES (v_doc.org_id, v_client_id, 'Valuation', 'Projeto Padrão', 'Concluído')
                RETURNING id INTO v_val_id;
            END IF;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM public.financial_documents WHERE id = v_doc.id) THEN
            INSERT INTO public.financial_documents (
                id, org_id, valuation_id, document_type, file_name, sharepoint_path, file_path, file_size, status, metadata, upload_date, created_at
            ) VALUES (
                v_doc.id, v_doc.org_id, v_val_id, 
                CASE 
                    WHEN v_doc.document_type IN ('Balanço', 'Balancete', 'DRE', 'Fluxo de Caixa') THEN v_doc.document_type
                    WHEN v_doc.document_type = 'Balanço Patrimonial' THEN 'Balanço'
                    ELSE 'Balanço' 
                END, 
                v_doc.filename, NULL, v_doc.file_path, v_doc.file_size, v_doc.status, v_doc.metadata, COALESCE(v_doc.created_at, now()), COALESCE(v_doc.created_at, now())
            );

            -- Migrate document_rows to financial_data
            INSERT INTO public.financial_data (
                org_id, document_id, row_number, account_name, value, period, created_at
            )
            SELECT 
                r.org_id, r.document_id, r.row_index, 
                COALESCE(r.data->>'description', r.data->>'account_description', 'Desconhecido'),
                NULLIF(regexp_replace(COALESCE(r.data->>'value_year_n', r.data->>'value', r.data->>'total', r.data->>'current_balance', '0'), '[^0-9.-]', '', 'g'), '')::numeric,
                COALESCE(r.data->>'year_n', r.data->>'period', 'N/A'),
                r.created_at
            FROM public.document_rows r
            WHERE r.document_id = v_doc.id;
        END IF;
    END LOOP;
END $$;
