-- Fix the search_path for get_public_submissions function
-- The current function shows config_settings as null, need to properly set search_path

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
    theme theme_type,
    tags text[]
)
SECURITY INVOKER
STABLE
LANGUAGE sql
SET search_path TO 'public'
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