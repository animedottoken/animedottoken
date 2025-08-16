-- Recreate the public_submissions view without sensitive fields
-- This is safer than trying to apply RLS to views
DROP VIEW IF EXISTS public.public_submissions;

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
    -- Excluded sensitive fields:
    -- - author_bio (may contain personal information)
    -- - nft_address (could be sensitive)
    -- - contact (definitely sensitive, already excluded)
FROM community_submissions
WHERE status = 'approved'::submission_status;

-- Grant appropriate permissions to the view
-- Only authenticated users and service role should access this
GRANT SELECT ON public.public_submissions TO authenticated;
GRANT SELECT ON public.public_submissions TO service_role;