-- Enable RLS
ALTER TABLE public.plano_contas_taxonomia ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE public.plano_contas_taxonomia TO authenticated;
GRANT ALL ON TABLE public.plano_contas_taxonomia TO service_role;

-- Drop old policies
DROP POLICY IF EXISTS "tenant_isolation_taxonomia_delete" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "tenant_isolation_taxonomia_insert" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "tenant_isolation_taxonomia_select" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "tenant_isolation_taxonomia_update" ON public.plano_contas_taxonomia;

DROP POLICY IF EXISTS "App_Select_plano_contas_taxonomia" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "App_Insert_plano_contas_taxonomia" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "App_Update_plano_contas_taxonomia" ON public.plano_contas_taxonomia;
DROP POLICY IF EXISTS "App_Delete_plano_contas_taxonomia" ON public.plano_contas_taxonomia;

-- Create new policies
CREATE POLICY "App_Select_plano_contas_taxonomia" ON public.plano_contas_taxonomia
  FOR SELECT TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin'::text);

CREATE POLICY "App_Insert_plano_contas_taxonomia" ON public.plano_contas_taxonomia
  FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin'::text);

CREATE POLICY "App_Update_plano_contas_taxonomia" ON public.plano_contas_taxonomia
  FOR UPDATE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin'::text) WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin'::text);

CREATE POLICY "App_Delete_plano_contas_taxonomia" ON public.plano_contas_taxonomia
  FOR DELETE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin'::text);

-- Ensure grants for related tables just in case
GRANT ALL ON TABLE public.plano_contas TO authenticated;
GRANT ALL ON TABLE public.plano_contas TO service_role;

GRANT ALL ON TABLE public.tipos_documentos TO authenticated;
GRANT ALL ON TABLE public.tipos_documentos TO service_role;

GRANT ALL ON TABLE public.documento_conta_mapping TO authenticated;
GRANT ALL ON TABLE public.documento_conta_mapping TO service_role;
