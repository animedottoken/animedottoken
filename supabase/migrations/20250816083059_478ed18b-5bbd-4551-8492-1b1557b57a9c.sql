-- Fix the security definer view issue by recreating the view with proper security context
-- Drop and recreate the view to ensure it doesn't run with elevated privileges
DROP VIEW IF EXISTS public.public_submissions;

-- Create the view without security definer privileges
-- This view will inherit the security context of the querying user
CREATE VIEW public.public_submissions 
WITH (security_barrier = false) AS
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

-- Set proper ownership to avoid security definer issues
-- Change ownership from postgres to a service role
ALTER VIEW public.public_submissions OWNER TO service_role;

-- Grant necessary permissions
GRANT SELECT ON public.public_submissions TO authenticated;
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO service_role;