-- Fix infinite recursion or permission denied when fetching own profile
DROP POLICY IF EXISTS "tenant_isolation_users_select" ON public.users;

CREATE POLICY "tenant_isolation_users_select" ON public.users 
FOR SELECT TO authenticated 
USING (
  id = auth.uid() OR org_id = public.get_user_org_id()
);
