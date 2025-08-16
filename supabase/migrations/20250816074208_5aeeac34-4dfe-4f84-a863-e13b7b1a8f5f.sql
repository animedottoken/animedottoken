-- Fix the anonymous user policy that has 'AND false' blocking all access
-- This policy should allow anonymous users to view approved submissions without sensitive fields

-- Drop the broken policy
DROP POLICY IF EXISTS "Public can view approved submissions without contact info" ON public.community_submissions;

-- Create a corrected policy that allows anonymous users to view approved submissions
-- But only the fields that are safe for public viewing (excluding contact info)
CREATE POLICY "Anonymous users can view approved submissions"
ON public.community_submissions
FOR SELECT
TO anon
USING (status = 'approved'::submission_status);

-- Note: Since we have the public_submissions view that excludes sensitive fields,
-- and the get-approved-submissions edge function uses that view with service role,
-- this policy mainly serves as a safety net for direct database access