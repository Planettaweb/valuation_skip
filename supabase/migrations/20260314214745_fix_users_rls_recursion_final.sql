-- Ensure get_user_org_id bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_org_id() 
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
  RETURN v_org_id;
END;
$$;

-- Ensure get_user_role_name bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role_name() 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_role_name text;
BEGIN
  SELECT r.name INTO v_role_name
  FROM public.users_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid() LIMIT 1;
  RETURN v_role_name;
END;
$$;

-- Drop existing policy that causes infinite recursion via direct subquery
DROP POLICY IF EXISTS "tenant_isolation_users_select" ON public.users;

-- Create new policy utilizing the SECURITY DEFINER function
CREATE POLICY "tenant_isolation_users_select" ON public.users 
FOR SELECT TO authenticated 
USING (
  id = auth.uid() OR 
  org_id = public.get_user_org_id()
);
