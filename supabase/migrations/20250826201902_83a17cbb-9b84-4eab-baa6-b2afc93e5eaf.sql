-- Fix Critical Security Vulnerabilities: mint_jobs, user_profiles, marketplace_settings
-- Implement proper access control for all three tables

-- ISSUE 1: Fix mint_jobs table - restrict wallet address visibility
DROP POLICY IF EXISTS "Users can view their wallet's mint jobs" ON public.mint_jobs;

-- Create secure policies for mint_jobs
CREATE POLICY "Users can only view their own mint jobs" 
ON public.mint_jobs 
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "Service role can view all mint jobs" 
ON public.mint_jobs 
FOR SELECT 
USING (auth.role() = 'service_role');

-- ISSUE 2: Fix user_profiles table - remove overly permissive public access
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view extended profile info" ON public.user_profiles;

-- Create proper restrictive policies for user_profiles
CREATE POLICY "Users can view their own complete profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  wallet_address = (auth.jwt() ->> 'wallet_address') 
  OR id::text = (auth.uid())::text
);

CREATE POLICY "Authenticated users can view limited profile info" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND (verified = true OR profile_rank != 'DEFAULT')
);

-- ISSUE 3: Fix marketplace_settings - restrict platform financial information
DROP POLICY IF EXISTS "Marketplace settings are viewable by everyone" ON public.marketplace_settings;

-- Create secure policies for marketplace_settings
CREATE POLICY "Only authenticated users can view marketplace settings" 
ON public.marketplace_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Only service role can view all marketplace settings" 
ON public.marketplace_settings 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Create secure public functions to provide necessary data without exposing sensitive info

-- Public marketplace info function (without sensitive platform wallet)
CREATE OR REPLACE FUNCTION public.get_marketplace_info_public()
RETURNS TABLE(
  platform_fee_percentage numeric,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ms.platform_fee_percentage,
    ms.updated_at
  FROM public.marketplace_settings ms
  ORDER BY ms.updated_at DESC
  LIMIT 1;
$$;

-- Authenticated marketplace info function (with platform wallet for transactions)
CREATE OR REPLACE FUNCTION public.get_marketplace_settings_authenticated()
RETURNS TABLE(
  id uuid,
  platform_fee_percentage numeric,
  platform_wallet_address text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    ms.id,
    ms.platform_fee_percentage,
    ms.platform_wallet_address,
    ms.created_at,
    ms.updated_at
  FROM public.marketplace_settings ms
  ORDER BY ms.updated_at DESC
  LIMIT 1;
$$;

-- Update user profile functions to work with new restrictive policies
CREATE OR REPLACE FUNCTION public.get_profiles_public()
RETURNS TABLE(
  id uuid, wallet_address_masked text, verified boolean, profile_rank text,
  trade_count integer, created_at timestamptz, display_name text, profile_image_url text,
  bio text, twitter_handle text, discord_handle text, website_url text, banner_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id,
    concat(left(up.wallet_address, 4), '...', right(up.wallet_address, 4)) as wallet_address_masked,
    up.verified,
    up.profile_rank,
    up.trade_count,
    up.created_at,
    -- Only show display info for verified or high-ranking users
    CASE 
      WHEN up.verified = true OR up.profile_rank != 'DEFAULT' THEN up.display_name 
      ELSE NULL 
    END as display_name,
    CASE 
      WHEN up.verified = true THEN up.profile_image_url 
      ELSE NULL 
    END as profile_image_url,
    -- Never expose sensitive data publicly
    NULL::text as bio,
    NULL::text as twitter_handle,
    NULL::text as discord_handle,
    NULL::text as website_url,
    NULL::text as banner_image_url
  FROM public.user_profiles up;
$$;

CREATE OR REPLACE FUNCTION public.get_profiles_authenticated()
RETURNS TABLE(
  id uuid, wallet_address_masked text, display_name text, nickname text, bio text,
  profile_image_url text, banner_image_url text, verified boolean, profile_rank text,
  trade_count integer, twitter_handle text, discord_handle text, website_url text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    up.id,
    concat(left(up.wallet_address, 4), '...', right(up.wallet_address, 4)) as wallet_address_masked,
    up.display_name,
    up.nickname,
    up.bio,
    up.profile_image_url,
    up.banner_image_url,
    up.verified,
    up.profile_rank,
    up.trade_count,
    -- Only show social handles for verified users
    CASE 
      WHEN up.verified = true THEN up.twitter_handle 
      ELSE NULL 
    END as twitter_handle,
    CASE 
      WHEN up.verified = true THEN up.discord_handle 
      ELSE NULL 
    END as discord_handle,
    CASE 
      WHEN up.verified = true THEN up.website_url 
      ELSE NULL 
    END as website_url,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_marketplace_info_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_settings_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_authenticated() TO authenticated;

-- Add security comments
COMMENT ON POLICY "Users can only view their own mint jobs" ON public.mint_jobs IS 'Restricts mint job access to wallet owner only - prevents wallet address exposure';
COMMENT ON POLICY "Users can view their own complete profile" ON public.user_profiles IS 'Users have full access to their own profile data';
COMMENT ON POLICY "Authenticated users can view limited profile info" ON public.user_profiles IS 'Authenticated users can see limited profile data from verified/high-ranking users only';
COMMENT ON POLICY "Only authenticated users can view marketplace settings" ON public.marketplace_settings IS 'Restricts access to platform financial information to authenticated users only';

COMMENT ON FUNCTION public.get_marketplace_info_public() IS 'Public function providing only non-sensitive marketplace information (fee percentage)';
COMMENT ON FUNCTION public.get_marketplace_settings_authenticated() IS 'Authenticated function providing complete marketplace settings including platform wallet for transactions';
COMMENT ON FUNCTION public.get_profiles_public() IS 'Public function providing safe profile data with masked wallet addresses';
COMMENT ON FUNCTION public.get_profiles_authenticated() IS 'Authenticated function providing enhanced profile data with privacy protection';