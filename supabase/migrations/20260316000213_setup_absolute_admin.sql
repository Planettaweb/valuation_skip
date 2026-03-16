-- Set up absolute global admin access for laetjr@hotmail.com

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_admin_role_id uuid;
  v_target_email text := 'laetjr@hotmail.com';
  t text;
  pol_name text;
  p_id uuid;
BEGIN
  -- 1. Ensure a default organization exists to attach the system admin
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  IF v_org_id IS NULL THEN
    v_org_id := gen_random_uuid();
    INSERT INTO public.organizations (id, name, slug, is_active, is_default)
    VALUES (v_org_id, 'System Administration', 'system-admin', true, true);
  END IF;

  -- 2. Ensure the 'Admin' role exists
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  IF v_admin_role_id IS NULL THEN
    v_admin_role_id := gen_random_uuid();
    INSERT INTO public.roles (id, name, description, is_active)
    VALUES (v_admin_role_id, 'Admin', 'Absolute System Administrator', true);
  END IF;

  -- 3. Ensure the target user exists in auth.users with correct constraints
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email LIMIT 1;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', v_target_email,
      crypt('Admin@123456!', gen_salt('bf')), NOW(),
      NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "System Administrator"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
  END IF;

  -- 4. Ensure the target user exists in public.users and is active/verified
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    INSERT INTO public.users (id, org_id, email, full_name, is_active, is_verified)
    VALUES (v_user_id, v_org_id, v_target_email, 'System Administrator', true, true);
  ELSE
    UPDATE public.users 
    SET is_active = true, is_verified = true 
    WHERE id = v_user_id;
  END IF;

  -- 5. Link the user exclusively to the 'Admin' role
  DELETE FROM public.users_roles WHERE user_id = v_user_id;
  INSERT INTO public.users_roles (user_id, role_id) VALUES (v_user_id, v_admin_role_id);

  -- 6. Ensure comprehensive permission mapping for the Admin role across all resources
  INSERT INTO public.permissions (resource, action, description)
  SELECT r, a, 'Auto-generated ' || a || ' for ' || r
  FROM unnest(ARRAY[
    'clients', 'documents', 'document_rows', 'financial_documents',
    'financial_data', 'financial_balancete', 'financial_balanco_patrimonial',
    'financial_dre', 'financial_fluxo_caixa', 'valuations',
    'valuation_projects', 'users', 'roles', 'permissions', 'organizations',
    'knowledge_bases', 'kb_documents'
  ]) AS r
  CROSS JOIN unnest(ARRAY['create', 'read', 'update', 'delete']) AS a
  ON CONFLICT (resource, action) DO NOTHING;

  -- Map all generated permissions to the Admin role
  FOR p_id IN (SELECT id FROM public.permissions) LOOP
    INSERT INTO public.role_permissions (role_id, permission_id, allowed)
    VALUES (v_admin_role_id, p_id, true)
    ON CONFLICT (role_id, permission_id) DO UPDATE SET allowed = true;
  END LOOP;

  -- 7. Guarantee RLS bypass policies for the 'Admin' role across all functional tables
  -- This overrides standard tenant isolation logic
  FOR t IN SELECT unnest(ARRAY[
    'clients', 'documents', 'document_rows', 'financial_documents',
    'financial_data', 'financial_balancete', 'financial_balanco_patrimonial',
    'financial_dre', 'financial_fluxo_caixa', 'valuations',
    'valuation_projects', 'users', 'roles', 'permissions', 'organizations',
    'knowledge_bases', 'kb_documents'
  ]) LOOP
    pol_name := 'admin_all_access_' || t;
    
    -- Drop it first if it exists to ensure a clean state
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, t);
    
    -- Create the permissive policy for Admins
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.get_user_role_name() = ''Admin'') WITH CHECK (public.get_user_role_name() = ''Admin'')', 
      pol_name, 
      t
    );
  END LOOP;

END $$;
