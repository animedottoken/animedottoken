-- Fix the remaining contact info exposure issue
-- Remove the policy that still allows authenticated users to see contact info

-- Drop the policy that still exposes contact info to authenticated users
DROP POLICY IF EXISTS "Authenticated non-admin users can view approved submissions" ON public.community_submissions;

-- Update the existing authenticated policy to be more specific about excluding admins
-- This ensures only admins can see contact info directly
DROP POLICY IF EXISTS "Authenticated can view approved submissions" ON public.community_submissions;

-- Create a view-based security model where non-admin users must use the public_submissions view
-- Only admins get direct access to community_submissions with contact info
-- All other access (public and authenticated non-admin) should go through edge functions using the public_submissions view

-- No policy for non-admin authenticated users - they must use the edge function
-- This ensures contact info is never exposed to non-admin users