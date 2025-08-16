-- Fix the security definer view issue by recreating the view properly
-- First, drop the existing view
DROP VIEW IF EXISTS public.public_submissions;

-- Create a function that returns approved submissions using SECURITY INVOKER
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
    theme theme_type,
    nft_address text,
    tags text[],
    author_bio text
)
LANGUAGE SQL
STABLE
SECURITY INVOKER  -- Uses the calling user's permissions, not elevated privileges
SET search_path = 'public'
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

-- Create a new RLS policy that allows public access to approved submissions only
CREATE POLICY "Public can view approved submissions" 
ON public.community_submissions 
FOR SELECT 
TO public
USING (status = 'approved');

-- Now create the view using the function
CREATE VIEW public.public_submissions AS 
SELECT * FROM public.get_approved_submissions();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_approved_submissions() TO anon;
GRANT EXECUTE ON FUNCTION public.get_approved_submissions() TO authenticated;
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;