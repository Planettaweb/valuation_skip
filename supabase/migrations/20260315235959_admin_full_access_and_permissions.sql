-- Step 1: Ensure all resource permissions exist
INSERT INTO public.permissions (resource, action, description)
SELECT r, a, 'Auto-generated ' || a || ' for ' || r
FROM unnest(ARRAY[
  'clients', 
  'documents', 
  'financial_documents', 
  'financial_data', 
  'financial_balancete', 
  'financial_balanco_patrimonial', 
  'financial_dre', 
  'financial_fluxo_caixa', 
  'valuations', 
  'valuation_projects',
  'users', 
  'roles', 
  'permissions', 
  'organizations'
]) AS r
CROSS JOIN unnest(ARRAY['create', 'read', 'update', 'delete']) AS a
ON CONFLICT (resource, action) DO NOTHING;

-- Step 2: Assign ALL permissions to the 'Admin' role dynamically
DO $$
DECLARE
  v_admin_role_id uuid;
  p_id uuid;
BEGIN
  -- Get the Admin role ID
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  
  IF v_admin_role_id IS NOT NULL THEN
    -- Iterate through all existing permissions and ensure Admin has them allowed
    FOR p_id IN (SELECT id FROM public.permissions) LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, allowed)
      VALUES (v_admin_role_id, p_id, true)
      ON CONFLICT (role_id, permission_id) DO UPDATE SET allowed = true;
    END LOOP;
  END IF;
END $$;

-- Step 3: Ensure RLS bypass policies for the 'Admin' role on all core tables
-- This guarantees Admins have unrestricted access regardless of tenant logic
DO $$
DECLARE
  t text;
  pol_name text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'clients', 
    'documents', 
    'financial_documents', 
    'financial_data', 
    'financial_balancete', 
    'financial_balanco_patrimonial', 
    'financial_dre', 
    'financial_fluxo_caixa', 
    'valuations', 
    'valuation_projects',
    'organizations',
    'roles',
    'users'
  ]) LOOP
    pol_name := 'admin_all_access_' || t;
    
    -- Drop it first if it exists to ensure clean state
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, t);
    
    -- Create the permissive policy for Admins
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.get_user_role_name() = ''Admin'') WITH CHECK (public.get_user_role_name() = ''Admin'')', 
      pol_name, 
      t
    );
  END LOOP;
END $$;
