-- 1. Clean existing data to provide a clean state
DELETE FROM public.kb_documents;
DELETE FROM public.document_rows;
DELETE FROM public.documents;
DELETE FROM public.valuation_projects;

-- Fix potential nulls in auth.users tokens to avoid 500 errors
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL OR recovery_token IS NULL
  OR email_change_token_new IS NULL OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- 2. Alter users schema
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN is_active SET DEFAULT false;

-- 3. Setup Roles
INSERT INTO public.roles (id, name, description) VALUES 
  (gen_random_uuid(), 'Admin', 'Full control'),
  (gen_random_uuid(), 'Analyst', 'Read/write documents'),
  (gen_random_uuid(), 'Viewer', 'Read-only')
ON CONFLICT (name) DO NOTHING;

-- 4. Setup user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id uuid;
  v_is_new_org boolean := false;
  v_role_id uuid;
BEGIN
  -- Try to find an organization by name
  SELECT id INTO v_org_id FROM public.organizations WHERE name = NEW.raw_user_meta_data->>'org_name' LIMIT 1;
  
  -- Create new org if none found
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name', 'Default Org'), 
      regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'org_name', 'default-org')), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(random()::text), 1, 6)
    ) RETURNING id INTO v_org_id;
    v_is_new_org := true;
  END IF;

  -- Insert profile
  INSERT INTO public.users (id, org_id, email, full_name, is_active)
  VALUES (
    NEW.id,
    v_org_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_is_new_org -- First user in new org is active Admin
  );

  -- Assign Role
  IF v_is_new_org THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  ELSE
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Viewer' LIMIT 1;
  END IF;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.users_roles (user_id, role_id) VALUES (NEW.id, v_role_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Helper function for RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id() RETURNS uuid AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role_name() RETURNS text AS $$
  SELECT r.name 
  FROM public.users_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Setup RLS
-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select_own_org" ON public.users;
DROP POLICY IF EXISTS "tenant_isolation_users_select" ON public.users;
CREATE POLICY "tenant_isolation_users_select" ON public.users FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
DROP POLICY IF EXISTS "tenant_isolation_users_update" ON public.users;
CREATE POLICY "tenant_isolation_users_update" ON public.users FOR UPDATE TO authenticated USING (org_id = public.get_user_org_id());

-- Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations FOR SELECT TO authenticated USING (id = public.get_user_org_id());

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_select_own_org" ON public.documents;
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (
  org_id = public.get_user_org_id() AND public.get_user_role_name() IN ('Admin', 'Analyst')
);
DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents FOR UPDATE TO authenticated USING (
  org_id = public.get_user_org_id() AND public.get_user_role_name() IN ('Admin', 'Analyst')
);
DROP POLICY IF EXISTS "documents_delete" ON public.documents;
CREATE POLICY "documents_delete" ON public.documents FOR DELETE TO authenticated USING (
  org_id = public.get_user_org_id() AND public.get_user_role_name() IN ('Admin', 'Analyst')
);

-- Users Roles
ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_roles_select" ON public.users_roles;
CREATE POLICY "users_roles_select" ON public.users_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "users_roles_insert" ON public.users_roles;
CREATE POLICY "users_roles_insert" ON public.users_roles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.users target WHERE target.id = user_id AND target.org_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "users_roles_update" ON public.users_roles;
CREATE POLICY "users_roles_update" ON public.users_roles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users target WHERE target.id = user_id AND target.org_id = public.get_user_org_id())
);
DROP POLICY IF EXISTS "users_roles_delete" ON public.users_roles;
CREATE POLICY "users_roles_delete" ON public.users_roles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users target WHERE target.id = user_id AND target.org_id = public.get_user_org_id())
);

-- Roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles FOR SELECT TO authenticated USING (true);

-- 7. Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
DROP POLICY IF EXISTS "storage_update" ON storage.objects;
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- 8. Enable Realtime on Documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
