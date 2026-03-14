-- Ensure Row Level Security is enabled for RBAC tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Grant explicit SELECT permissions to the authenticated role to prevent API access denials
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

-- Create SELECT policy for authenticated users to read from permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'authenticated_read_permissions'
    ) THEN
        CREATE POLICY "authenticated_read_permissions" ON public.permissions
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END
$$;

-- Create SELECT policy for authenticated users to read from role_permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND policyname = 'authenticated_read_role_permissions'
    ) THEN
        CREATE POLICY "authenticated_read_role_permissions" ON public.role_permissions
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END
$$;
