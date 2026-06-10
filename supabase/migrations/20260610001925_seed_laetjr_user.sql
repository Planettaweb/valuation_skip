DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_role_id uuid;
BEGIN
  -- 1. Ensure an organization exists
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  
  IF v_org_id IS NULL THEN
    v_org_id := gen_random_uuid();
    INSERT INTO public.organizations (id, name, slug, is_active) 
    VALUES (v_org_id, 'Nearbound', 'nearbound', true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;

  -- 2. Seed laetjr@hotmail.com user into auth.users safely
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'laetjr@hotmail.com') THEN
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'laetjr@hotmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Laet Jr"}',
      false, 'authenticated', 'authenticated',
      '',    -- confirmation_token: MUST be '' not NULL
      '',    -- recovery_token: MUST be '' not NULL
      '',    -- email_change_token_new: MUST be '' not NULL
      '',    -- email_change: MUST be '' not NULL
      '',    -- email_change_token_current: MUST be '' not NULL
      NULL,  -- phone: MUST be NULL (not '') due to UNIQUE constraint
      '',    -- phone_change: MUST be '' not NULL
      '',    -- phone_change_token: MUST be '' not NULL
      ''     -- reauthentication_token: MUST be '' not NULL
    );

    -- 3. Link profile in public.users
    INSERT INTO public.users (id, org_id, email, full_name, is_active)
    VALUES (v_user_id, v_org_id, 'laetjr@hotmail.com', 'Laet Jr', true)
    ON CONFLICT (id) DO UPDATE SET 
      is_active = true, 
      org_id = EXCLUDED.org_id;
      
    -- 4. Assign Admin Role
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.users_roles (user_id, role_id)
      VALUES (v_user_id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  ELSE
    -- If user exists, just make sure they are active and have the Admin role assigned
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'laetjr@hotmail.com' LIMIT 1;
    
    UPDATE public.users SET is_active = true WHERE id = v_user_id;
    
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.users_roles (user_id, role_id)
      VALUES (v_user_id, v_role_id)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;
END $$;
