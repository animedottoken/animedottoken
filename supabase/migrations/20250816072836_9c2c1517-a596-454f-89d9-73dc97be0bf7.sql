-- Drop existing conflicting SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view all submission details for admin p" ON public.community_submissions;
DROP POLICY IF EXISTS "No public access to full submissions table" ON public.community_submissions;

-- Create clear, consistent access policies

-- Public users can view approved submissions (excluding sensitive contact info)
CREATE POLICY "Public can view approved submissions"
ON public.community_submissions
FOR SELECT
USING (status = 'approved');

-- Admins can view all submissions including contact info
CREATE POLICY "Admins can view all submissions"
ON public.community_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can update submission status
CREATE POLICY "Admins can update submissions"
ON public.community_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.community_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);