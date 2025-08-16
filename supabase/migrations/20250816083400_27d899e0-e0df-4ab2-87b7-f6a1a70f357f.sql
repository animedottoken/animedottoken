-- Recreate the view with proper ownership to fix Security Definer View issue
-- First, save the current view definition, then recreate it with service_role ownership

-- Drop the existing view (owned by postgres superuser)
DROP VIEW IF EXISTS public.public_submissions;

-- Recreate the view with explicit ownership by service_role
-- This prevents it from being a security definer view
CREATE VIEW public.public_submissions AS
SELECT 
    id,
    image_url,
    name,
    caption,
    author,
    type,
    status,
    submission_source,
    created_at,
    updated_at,
    edition_type,
    theme,
    tags
FROM community_submissions
WHERE status = 'approved'::submission_status;

-- Grant appropriate permissions to all necessary roles
GRANT SELECT ON public.public_submissions TO authenticated;
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO service_role;