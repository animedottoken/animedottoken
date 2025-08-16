-- Create a public view that excludes sensitive contact information
CREATE OR REPLACE VIEW public.public_submissions AS
SELECT 
  id,
  image_url,
  name,
  caption,
  author,
  author_bio,
  tags,
  type,
  status,
  submission_source,
  created_at,
  updated_at,
  edition_type,
  theme,
  nft_address
FROM public.community_submissions
WHERE status = 'approved';

-- Enable RLS on the view
ALTER VIEW public.public_submissions SET (security_invoker = true);

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.community_submissions;

-- Create new restrictive policy - no public SELECT access to the main table
CREATE POLICY "No public access to full submissions table" 
ON public.community_submissions 
FOR SELECT 
USING (false);

-- Allow public SELECT access only to the sanitized view
GRANT SELECT ON public.public_submissions TO anon;
GRANT SELECT ON public.public_submissions TO authenticated;

-- Create admin access policy for full table access (assuming admin role system)
-- For now, we'll use a simple authenticated user policy for admin panel access
-- This should be enhanced with proper role-based access control later
CREATE POLICY "Authenticated users can view all submission details for admin purposes" 
ON public.community_submissions 
FOR SELECT 
TO authenticated
USING (true);

-- Keep the existing insert policy unchanged
-- "Anyone can create submissions" policy remains as-is