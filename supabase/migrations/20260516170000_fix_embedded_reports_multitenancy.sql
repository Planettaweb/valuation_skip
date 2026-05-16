-- 1. Remove Global Reports (client_id IS NULL) to allow NOT NULL constraint
DELETE FROM public.embedded_reports WHERE client_id IS NULL;

-- 2. Make client_id NOT NULL
ALTER TABLE public.embedded_reports ALTER COLUMN client_id SET NOT NULL;

-- 3. Fix RLS for embedded_reports to enforce strict client isolation for non-admins
DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_select" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_select" ON public.embedded_reports
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND (
      get_user_role_name() = 'Admin' 
      OR client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_insert" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_insert" ON public.embedded_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_update" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_update" ON public.embedded_reports
  FOR UPDATE TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  )
  WITH CHECK (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );

DROP POLICY IF EXISTS "tenant_isolation_embedded_reports_delete" ON public.embedded_reports;
CREATE POLICY "tenant_isolation_embedded_reports_delete" ON public.embedded_reports
  FOR DELETE TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );

-- 4. Fix clients RLS to ensure tenant isolation (Drop rogue permissive policies)
DROP POLICY IF EXISTS "App_Select_clients" ON public.clients;
DROP POLICY IF EXISTS "App_Insert_clients" ON public.clients;
DROP POLICY IF EXISTS "App_Update_clients" ON public.clients;
DROP POLICY IF EXISTS "App_Delete_clients" ON public.clients;

-- Enforce strict multitenancy so a user only sees their own assigned client (or Admin sees all)
DROP POLICY IF EXISTS "tenant_isolation_clients" ON public.clients;
CREATE POLICY "tenant_isolation_clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND (
      get_user_role_name() = 'Admin' 
      OR user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tenant_isolation_clients_insert" ON public.clients;
CREATE POLICY "tenant_isolation_clients_insert" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );

DROP POLICY IF EXISTS "tenant_isolation_clients_update" ON public.clients;
CREATE POLICY "tenant_isolation_clients_update" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  )
  WITH CHECK (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );

DROP POLICY IF EXISTS "tenant_isolation_clients_delete" ON public.clients;
CREATE POLICY "tenant_isolation_clients_delete" ON public.clients
  FOR DELETE TO authenticated
  USING (
    org_id = get_user_org_id() 
    AND get_user_role_name() = 'Admin'
  );
