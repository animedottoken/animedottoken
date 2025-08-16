-- Create a public view that excludes sensitive contact information
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

-- Enable RLS on the view
ALTER VIEW public.public_submissions SET (security_invoker = on);

-- Grant access to the view
GRANT SELECT ON public.public_submissions TO anon, authenticated;

-- Update the public policy to be more explicit about sensitive data protection
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.community_submissions;

-- Create a more restrictive policy that explicitly blocks sensitive fields access
CREATE POLICY "Public can view approved submissions without contact info"
ON public.community_submissions
FOR SELECT
USING (
  status = 'approved' 
  AND auth.role() = 'anon'
  AND false  -- Block direct table access for public users
);

-- Allow authenticated users to access approved submissions through the table
-- (they can use the view or table, but admins need table access)
CREATE POLICY "Authenticated can view approved submissions"
ON public.community_submissions  
FOR SELECT
USING (
  status = 'approved' 
  AND auth.role() = 'authenticated'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);