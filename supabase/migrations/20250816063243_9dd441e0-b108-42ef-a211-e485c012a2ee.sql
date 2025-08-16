-- Fix security definer view issue by recreating the view without security definer
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
    nft_address,
    tags,
    author_bio
FROM public.community_submissions 
WHERE status = 'approved';

-- Grant access to the updated view
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;

-- Fix function search path issue by setting search_path
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;