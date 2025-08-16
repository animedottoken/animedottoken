-- Remove the policy that allows anyone to create submissions directly
-- This forces all submissions to go through the submit-content edge function
-- which provides better validation and security

DROP POLICY IF EXISTS "Anyone can create submissions" ON public.community_submissions;