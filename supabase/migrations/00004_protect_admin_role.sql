-- Migration to prevent assigning the admin role from the application client/REST API.
-- Only the SQL Editor (postgres/superuser) can assign the admin role.

CREATE OR REPLACE FUNCTION public.check_admin_role_assignment()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'admin' AND (OLD IS NULL OR OLD.role IS DISTINCT FROM 'admin') THEN
    IF current_user NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Assigning the admin role is restricted to the Supabase SQL Editor.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER protect_admin_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_role_assignment();
