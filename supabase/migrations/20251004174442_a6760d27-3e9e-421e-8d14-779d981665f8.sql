-- Fix security definer view warning
-- Remove the view as it's not needed - we use RLS-protected functions instead

DROP VIEW IF EXISTS public.public_profiles_limited;

-- The public profile access is now handled through:
-- 1. RLS policies on user_profiles table (authenticated users only)
-- 2. get_public_profile_limited() function for limited data
-- 3. get_profile_authenticated() function for full data (authenticated users)
-- 4. get_creators_public_explore() function for creator listings