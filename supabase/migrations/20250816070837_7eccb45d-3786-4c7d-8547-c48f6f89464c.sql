-- Remove the problematic view entirely and use direct queries instead
-- This eliminates the security definer view warning

DROP VIEW IF EXISTS public.public_submissions;
DROP FUNCTION IF EXISTS public.get_approved_submissions();

-- Remove the public policy we added (since we'll use direct queries with proper auth)
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.community_submissions;