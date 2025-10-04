-- Final security fix: Remove direct table access for public profiles
-- Force all public profile viewing through security definer functions that limit fields

-- Remove the current policy
DROP POLICY IF EXISTS "Authenticated users can view limited public profiles" ON public.user_profiles;

-- Create new restrictive policy: users can ONLY see their own profiles via direct table access
-- All public profile viewing MUST go through get_public_profile_limited() or get_profile_authenticated()
CREATE POLICY "Users can only view their own profile directly"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Users can ONLY see their own full profile via direct table queries
  (auth.uid() = user_id) 
  OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
);

COMMENT ON POLICY "Users can only view their own profile directly" ON public.user_profiles IS 
'Direct table access restricted to own profile only. Use get_public_profile_limited() or get_profile_authenticated() functions to view other profiles with proper field limiting.';