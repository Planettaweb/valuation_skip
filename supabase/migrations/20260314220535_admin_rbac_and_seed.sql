-- Admin policies for Users
CREATE POLICY "admin_all_users_select" ON public.users FOR SELECT TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_all_users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_all_users_update" ON public.users FOR UPDATE TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_all_users_delete" ON public.users FOR DELETE TO authenticated USING (public.get_user_role_name() = 'Admin');

-- Admin policies for Organizations
CREATE POLICY "admin_orgs_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_orgs_update" ON public.organizations FOR UPDATE TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_orgs_delete" ON public.organizations FOR DELETE TO authenticated USING (public.get_user_role_name() = 'Admin');

-- Admin policies for Roles
CREATE POLICY "admin_roles_insert" ON public.roles FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_roles_update" ON public.roles FOR UPDATE TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_roles_delete" ON public.roles FOR DELETE TO authenticated USING (public.get_user_role_name() = 'Admin');

-- Admin policies for Permissions
CREATE POLICY "admin_permissions_select" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_permissions_insert" ON public.permissions FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_permissions_update" ON public.permissions FOR UPDATE TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_permissions_delete" ON public.permissions FOR DELETE TO authenticated USING (public.get_user_role_name() = 'Admin');

-- Admin policies for Role Permissions
CREATE POLICY "admin_role_permissions_select" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_role_permissions_insert" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_role_permissions_update" ON public.role_permissions FOR UPDATE TO authenticated USING (public.get_user_role_name() = 'Admin');
CREATE POLICY "admin_role_permissions_delete" ON public.role_permissions FOR DELETE TO authenticated USING (public.get_user_role_name() = 'Admin');

-- Base Permissions (Seed Data)
INSERT INTO public.permissions (resource, action, description) VALUES
('users', 'create', 'Create users'),
('users', 'read', 'Read users'),
('users', 'update', 'Update users'),
('users', 'delete', 'Delete users'),
('organizations', 'create', 'Create orgs'),
('organizations', 'read', 'Read orgs'),
('organizations', 'update', 'Update orgs'),
('organizations', 'delete', 'Delete orgs'),
('roles', 'create', 'Create roles'),
('roles', 'read', 'Read roles'),
('roles', 'update', 'Update roles'),
('roles', 'delete', 'Delete roles')
ON CONFLICT (resource, action) DO NOTHING;

-- Map Admin Role explicitly so it has all permissions
DO $$
DECLARE
  v_admin_role_id uuid;
  p_id uuid;
BEGIN
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  IF v_admin_role_id IS NOT NULL THEN
    FOR p_id IN (SELECT id FROM public.permissions) LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, allowed)
      VALUES (v_admin_role_id, p_id, true)
      ON CONFLICT (role_id, permission_id) DO UPDATE SET allowed = true;
    END LOOP;
  END IF;
END $$;
