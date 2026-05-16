-- Fix get_user_role_name to correctly prioritize 'Admin' role when a user has multiple roles
-- This prevents RLS bugs where 'Viewer' is selected instead of 'Admin', causing empty lists

CREATE OR REPLACE FUNCTION public.get_user_role_name()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role_name text;
BEGIN
  -- First try to find if the user is an Admin
  SELECT r.name INTO v_role_name
  FROM public.users_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
  LIMIT 1;

  -- If not Admin, get the first available role deterministically
  IF v_role_name IS NULL THEN
    SELECT r.name INTO v_role_name
    FROM public.users_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    ORDER BY r.name ASC
    LIMIT 1;
  END IF;

  RETURN v_role_name;
END;
$function$;
