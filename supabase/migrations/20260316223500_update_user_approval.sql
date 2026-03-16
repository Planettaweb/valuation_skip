CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id uuid;
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
  END IF;

  -- Insert profile, ALWAYS inactive by default as per strict approval workflow
  INSERT INTO public.users (id, org_id, email, full_name, is_active)
  VALUES (
    NEW.id,
    v_org_id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    false
  );

  -- ALWAYS assign 'Viewer' role by default
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'Viewer' LIMIT 1;

  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.users_roles (user_id, role_id) VALUES (NEW.id, v_role_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
