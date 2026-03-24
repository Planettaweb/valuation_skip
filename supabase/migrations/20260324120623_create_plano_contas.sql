CREATE TABLE IF NOT EXISTS public.plano_contas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    codigo character varying,
    descricao text NOT NULL,
    ativo_inativo boolean DEFAULT true,
    data_cadastro timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plano_contas_client ON public.plano_contas USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_org ON public.plano_contas USING btree (org_id);

ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_plano_contas" ON public.plano_contas;
CREATE POLICY "tenant_isolation_plano_contas" ON public.plano_contas
    FOR ALL TO authenticated USING (org_id = public.get_user_org_id());
