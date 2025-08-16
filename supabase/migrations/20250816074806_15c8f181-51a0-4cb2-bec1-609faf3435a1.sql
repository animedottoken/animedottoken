-- Remove direct anonymous access to community_submissions table to prevent contact info exposure
-- All public access should go through the public_submissions view via edge functions

-- Drop the policy that allows anonymous users direct access to community_submissions
DROP POLICY IF EXISTS "Anonymous users can view approved submissions" ON public.community_submissions;

-- Ensure the public_submissions view has proper RLS (it should inherit security from being a view)
-- No direct policies needed on the view since it's read-only and excludes sensitive fields

-- Verify that authenticated users (non-admin) can still see approved submissions without contact
-- This policy is more restrictive and excludes contact info access
CREATE POLICY "Authenticated non-admin users can view approved submissions"
ON public.community_submissions
FOR SELECT
TO authenticated
USING (
  status = 'approved'::submission_status 
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  )
);

-- Note: This policy still allows access to the contact field for authenticated users
-- We need to ensure frontend code doesn't display it, and edge functions use the public view