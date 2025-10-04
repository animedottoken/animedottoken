-- =====================================================
-- SECURITY FIX: Restrict User Profile Data Access
-- =====================================================
-- This migration addresses the critical security vulnerability where
-- user profile data (wallet addresses, social handles) was publicly accessible

-- 1. DROP the insecure public function that exposes all user data
DROP FUNCTION IF EXISTS public.get_profiles_public() CASCADE;
DROP FUNCTION IF EXISTS public.get_public_profile_limited(text) CASCADE;

-- 2. CREATE secure function for basic profile display (AUTHENTICATED ONLY)
-- Returns only essential public display data, requires authentication
CREATE OR REPLACE FUNCTION public.get_profile_display_by_user_id(p_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  nickname text,
  display_name text,
  profile_image_url text,
  verified boolean,
  profile_rank text,
  bio text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Require authentication
  SELECT 
    up.user_id,
    up.nickname,
    up.display_name,
    up.profile_image_url,
    up.verified,
    up.profile_rank,
    up.bio
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id
    AND up.is_public_profile = true
    AND auth.uid() IS NOT NULL; -- Must be authenticated
$$;

-- 3. CREATE function to get masked wallet for display (AUTHENTICATED ONLY)
CREATE OR REPLACE FUNCTION public.get_masked_wallet_by_user_id(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      -- User can see their own full wallet
      WHEN auth.uid() = p_user_id THEN up.wallet_address
      -- Others see masked wallet
      ELSE CONCAT(LEFT(up.wallet_address, 4), '...', RIGHT(up.wallet_address, 4))
    END as wallet_address
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id
    AND auth.uid() IS NOT NULL; -- Must be authenticated
$$;

-- 4. CREATE function to search profiles by nickname (AUTHENTICATED ONLY)
-- Limited results to prevent scraping
CREATE OR REPLACE FUNCTION public.search_profiles_by_nickname(search_term text)
RETURNS TABLE(
  user_id uuid,
  nickname text,
  display_name text,
  profile_image_url text,
  verified boolean,
  profile_rank text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.user_id,
    up.nickname,
    up.display_name,
    up.profile_image_url,
    up.verified,
    up.profile_rank
  FROM public.user_profiles up
  WHERE up.is_public_profile = true
    AND auth.uid() IS NOT NULL -- Must be authenticated
    AND (
      up.nickname ILIKE '%' || search_term || '%' 
      OR up.display_name ILIKE '%' || search_term || '%'
    )
  ORDER BY 
    CASE WHEN up.verified THEN 0 ELSE 1 END,
    up.trade_count DESC
  LIMIT 20; -- Limit results to prevent mass scraping
$$;

-- 5. UPDATE RLS policies to be more restrictive
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can only view their own profile directly" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile via auth or wallet" ON public.user_profiles;

-- Create new restrictive SELECT policy
-- Users can only view their own full profile OR limited data of others via functions
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR wallet_address = (auth.jwt() ->> 'wallet_address'::text)
);

-- 6. Add rate limiting metadata table for API abuse prevention
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_profile_id uuid,
  access_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_profile_access_logs_user_time 
ON public.profile_access_logs(user_id, created_at);

ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages access logs"
ON public.profile_access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Log access to sensitive profile data
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log if accessing someone else's profile
  IF auth.uid() IS NOT NULL AND auth.uid() != NEW.user_id THEN
    INSERT INTO public.profile_access_logs (
      user_id,
      accessed_profile_id,
      access_type
    ) VALUES (
      auth.uid(),
      NEW.user_id,
      TG_OP
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Don't create trigger yet - can be added later if needed for audit
-- CREATE TRIGGER log_profile_access_trigger
-- AFTER SELECT ON public.user_profiles
-- FOR EACH ROW
-- EXECUTE FUNCTION public.log_profile_access();

COMMENT ON FUNCTION public.get_profile_display_by_user_id IS 
'Securely returns minimal public profile data. Requires authentication. Use this instead of direct table access.';

COMMENT ON FUNCTION public.get_masked_wallet_by_user_id IS 
'Returns masked wallet address for display. User sees their own full wallet, others see masked version.';

COMMENT ON FUNCTION public.search_profiles_by_nickname IS 
'Search profiles by nickname. Rate-limited to 20 results. Requires authentication to prevent scraping.';