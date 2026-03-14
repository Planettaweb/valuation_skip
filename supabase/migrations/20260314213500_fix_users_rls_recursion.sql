-- Fix infinite recursion in RLS by redefining get_user_org_id as plpgsql
-- A SECURITY DEFINER function in LANGUAGE sql can be inlined by the query planner,
-- stripping the SECURITY DEFINER context. This causes the internal SELECT to execute
-- as the calling user, triggering the RLS policy again and causing an infinite loop.
-- Using LANGUAGE plpgsql prevents inlining and properly bypasses RLS for the lookup.
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

-- Redefine get_user_role_name similarly to prevent potential recursion
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

-- Ensure the SELECT policy on users strictly allows self-access and tenant access
DROP POLICY IF EXISTS "tenant_isolation_users_select" ON public.users;

CREATE POLICY "tenant_isolation_users_select" ON public.users 
FOR SELECT TO authenticated 
USING (
  id = auth.uid() OR 
  org_id = public.get_user_org_id()
);
