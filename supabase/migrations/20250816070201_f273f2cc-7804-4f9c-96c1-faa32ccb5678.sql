-- The issue is that the public_submissions view may be bypassing RLS policies
-- Let's recreate it with proper security considerations

-- First, drop the existing view
DROP VIEW IF EXISTS public.public_submissions;

-- Create a new view that respects RLS by using a security invoker approach
-- Instead of a view, we'll create a function that returns the approved submissions
CREATE OR REPLACE FUNCTION public.get_approved_submissions()
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
    theme submission_theme,
    nft_address text,
    tags text[],
    author_bio text
)
LANGUAGE SQL
STABLE
SECURITY INVOKER  -- This is key - uses the calling user's permissions
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
    cs.nft_address,
    cs.tags,
    cs.author_bio
  FROM public.community_submissions cs
  WHERE cs.status = 'approved';
$$;

-- Grant execute permissions to public for this function
GRANT EXECUTE ON FUNCTION public.get_approved_submissions() TO anon;
GRANT EXECUTE ON FUNCTION public.get_approved_submissions() TO authenticated;

-- Now create a view that uses this function (this should not trigger the security definer warning)
CREATE VIEW public.public_submissions AS 
SELECT * FROM public.get_approved_submissions();

-- Grant select permissions on the view
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;