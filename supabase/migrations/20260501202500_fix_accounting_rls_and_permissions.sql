-- 1. Grant base permissions to authenticated role (fixes "permission denied for table" errors)
GRANT ALL ON TABLE public.plano_contas TO authenticated;
GRANT ALL ON TABLE public.plano_contas TO service_role;
GRANT ALL ON TABLE public.tipos_documentos TO authenticated;
GRANT ALL ON TABLE public.tipos_documentos TO service_role;
GRANT ALL ON TABLE public.documento_conta_mapping TO authenticated;
GRANT ALL ON TABLE public.documento_conta_mapping TO service_role;

-- 2. Drop existing RLS policies that might be incorrectly configured
DROP POLICY IF EXISTS "tenant_isolation_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "admin_all_access_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "App_Select_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "App_Insert_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "App_Update_plano_contas" ON public.plano_contas;
DROP POLICY IF EXISTS "App_Delete_plano_contas" ON public.plano_contas;

DROP POLICY IF EXISTS "tenant_isolation_tipos_documentos" ON public.tipos_documentos;
DROP POLICY IF EXISTS "admin_all_access_tipos_documentos" ON public.tipos_documentos;
DROP POLICY IF EXISTS "App_Select_tipos_documentos" ON public.tipos_documentos;
DROP POLICY IF EXISTS "App_Insert_tipos_documentos" ON public.tipos_documentos;
DROP POLICY IF EXISTS "App_Update_tipos_documentos" ON public.tipos_documentos;
DROP POLICY IF EXISTS "App_Delete_tipos_documentos" ON public.tipos_documentos;

DROP POLICY IF EXISTS "tenant_isolation_documento_conta_mapping" ON public.documento_conta_mapping;
DROP POLICY IF EXISTS "admin_all_access_documento_conta_mapping" ON public.documento_conta_mapping;
DROP POLICY IF EXISTS "App_Select_documento_conta_mapping" ON public.documento_conta_mapping;
DROP POLICY IF EXISTS "App_Insert_documento_conta_mapping" ON public.documento_conta_mapping;
DROP POLICY IF EXISTS "App_Update_documento_conta_mapping" ON public.documento_conta_mapping;
DROP POLICY IF EXISTS "App_Delete_documento_conta_mapping" ON public.documento_conta_mapping;

-- 3. Create explicit CRUD policies for plano_contas
CREATE POLICY "App_Select_plano_contas" ON public.plano_contas FOR SELECT TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Insert_plano_contas" ON public.plano_contas FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Update_plano_contas" ON public.plano_contas FOR UPDATE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin') WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Delete_plano_contas" ON public.plano_contas FOR DELETE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');

-- 4. Create explicit CRUD policies for tipos_documentos
CREATE POLICY "App_Select_tipos_documentos" ON public.tipos_documentos FOR SELECT TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Insert_tipos_documentos" ON public.tipos_documentos FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Update_tipos_documentos" ON public.tipos_documentos FOR UPDATE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin') WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Delete_tipos_documentos" ON public.tipos_documentos FOR DELETE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');

-- 5. Create explicit CRUD policies for documento_conta_mapping
CREATE POLICY "App_Select_documento_conta_mapping" ON public.documento_conta_mapping FOR SELECT TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Insert_documento_conta_mapping" ON public.documento_conta_mapping FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Update_documento_conta_mapping" ON public.documento_conta_mapping FOR UPDATE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin') WITH CHECK (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');
CREATE POLICY "App_Delete_documento_conta_mapping" ON public.documento_conta_mapping FOR DELETE TO authenticated USING (org_id = get_user_org_id() OR get_user_role_name() = 'Admin');

-- 6. Insert RBAC permissions
DO $$
BEGIN
  -- plano_contas permissions
  INSERT INTO public.permissions (id, resource, action, description) VALUES
    (gen_random_uuid(), 'plano_contas', 'read', 'Visualizar plano de contas'),
    (gen_random_uuid(), 'plano_contas', 'create', 'Criar contas no plano de contas'),
    (gen_random_uuid(), 'plano_contas', 'update', 'Atualizar contas no plano de contas'),
    (gen_random_uuid(), 'plano_contas', 'delete', 'Excluir contas no plano de contas')
  ON CONFLICT (resource, action) DO NOTHING;

  -- tipos_documentos permissions
  INSERT INTO public.permissions (id, resource, action, description) VALUES
    (gen_random_uuid(), 'tipos_documentos', 'read', 'Visualizar tipos de documentos'),
    (gen_random_uuid(), 'tipos_documentos', 'create', 'Criar tipos de documentos'),
    (gen_random_uuid(), 'tipos_documentos', 'update', 'Atualizar tipos de documentos'),
    (gen_random_uuid(), 'tipos_documentos', 'delete', 'Excluir tipos de documentos')
  ON CONFLICT (resource, action) DO NOTHING;

  -- matriz_relacionamento permissions
  INSERT INTO public.permissions (id, resource, action, description) VALUES
    (gen_random_uuid(), 'matriz_relacionamento', 'read', 'Visualizar matriz de relacionamento'),
    (gen_random_uuid(), 'matriz_relacionamento', 'update', 'Atualizar matriz de relacionamento')
  ON CONFLICT (resource, action) DO NOTHING;

  -- Automatically grant these permissions to Admin role if it exists
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT r.id, p.id, true
  FROM public.roles r
  CROSS JOIN public.permissions p
  WHERE r.name = 'Admin' 
    AND p.resource IN ('plano_contas', 'tipos_documentos', 'matriz_relacionamento')
  ON CONFLICT (role_id, permission_id) DO UPDATE SET allowed = true;

END $$;
