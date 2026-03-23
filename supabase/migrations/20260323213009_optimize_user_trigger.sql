-- Optimizes the handle_new_user trigger to prevent database timeouts 
-- and handles exceptions so user creation doesn't fail on Auth side.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id uuid;
  v_role_id uuid;
  v_org_name text;
  v_full_name text;
BEGIN
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', 'Default Org');
  v_full_name := NEW.raw_user_meta_data->>'full_name';

  -- Try to find an organization by name
  SELECT id INTO v_org_id FROM public.organizations WHERE name = v_org_name LIMIT 1;
  
  -- Create new org if none found
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (name, slug)
    VALUES (
      v_org_name, 
      regexp_replace(lower(v_org_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(random()::text), 1, 6)
    ) RETURNING id INTO v_org_id;
  END IF;

  -- Insert profile, ALWAYS inactive by default as per strict approval workflow
  INSERT INTO public.users (id, org_id, email, full_name, is_active)
  VALUES (
    NEW.id,
    v_org_id,
    NEW.email,
    v_full_name,
    false
  )
  ON CONFLICT (id) DO UPDATE SET 
    org_id = EXCLUDED.org_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_active = false;

  -- ALWAYS assign 'Viewer' role by default
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'Viewer' LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.users_roles (user_id, role_id) 
    VALUES (NEW.id, v_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but allow user creation to proceed so Auth doesn't fail
    -- The user will be created but might lack a complete profile initially
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
