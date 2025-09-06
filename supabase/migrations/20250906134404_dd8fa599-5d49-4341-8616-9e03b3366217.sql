-- Remove overly permissive policy that granted unrestricted access to user_profiles
DROP POLICY IF EXISTS "Service role full access to user profiles" ON public.user_profiles;

-- (No other changes to preserve existing functionality)
