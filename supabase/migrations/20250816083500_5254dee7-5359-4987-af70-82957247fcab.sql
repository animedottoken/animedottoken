-- Replace the problematic view with a security invoker function
-- This avoids the security definer view issue entirely

-- Create a function that returns the same data as the view
-- Using SECURITY INVOKER ensures it runs with the caller's privileges, not the owner's
CREATE OR REPLACE FUNCTION public.get_public_submissions()
RETURNS TABLE (
    id uuid,
    image_url text,
    name text,
    caption text,
    author text,
    type submission_type,
    status submission_status,
    submission_source submission_source,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    edition_type edition_type,
    theme text,
    tags text[]
)
SECURITY INVOKER
STABLE
LANGUAGE sql
AS $$
    SELECT 
        cs.id,
        cs.image_url,
        cs.name,
        cs.caption,
        cs.author,
        cs.type,
        cs.status,
        cs.submission_source,
        cs.created_at,
        cs.updated_at,
        cs.edition_type,
        cs.theme,
        cs.tags
    FROM community_submissions cs
    WHERE cs.status = 'approved'::submission_status
    ORDER BY cs.created_at DESC;
$$;

-- Grant execution permissions to the necessary roles
GRANT EXECUTE ON FUNCTION public.get_public_submissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_submissions() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_submissions() TO service_role;