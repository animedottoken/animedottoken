-- Remove the overly restrictive policy that blocks ALL access to user_profiles
DROP POLICY IF EXISTS "Block anonymous access to user profiles" ON public.user_profiles;

-- The existing policies should handle proper access control:
-- 1. "Service role can manage profiles" - allows system operations
-- 2. "Users can only access their own profile data" - allows users to manage their own profiles
-- 3. "Users can insert their own profile" - allows profile creation
-- 4. "Users can update their own profile via auth or wallet" - allows profile updates
-- 5. "Users can view their own profile via auth or wallet" - allows profile viewing

-- These existing policies already provide proper security by:
-- - Requiring authentication (auth.uid() checks)
-- - Ensuring users can only access their own data (wallet_address or user_id matching)
-- - Allowing service role for system operations

-- No additional policies needed - the existing ones provide proper access control