-- Fix Security Definer View issue by changing ownership to a non-superuser role
-- The view is currently owned by 'postgres' (superuser) which makes it a security definer view

-- Change ownership of the view to service_role (non-superuser)
-- This ensures the view doesn't run with elevated privileges
ALTER VIEW public.public_submissions OWNER TO service_role;

-- Verify the view still has appropriate permissions for access
-- Grant SELECT permissions to the roles that need access
GRANT SELECT ON public.public_submissions TO authenticated;
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO service_role;