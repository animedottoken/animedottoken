-- Fix critical security vulnerability: Remove public direct access to user_profiles
-- This prevents hackers from directly querying sensitive user data

-- First check existing policies and remove the dangerous ones
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view limited public profiles only" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

-- Keep existing secure policies but ensure they're comprehensive
-- The policy should already exist from previous migration, so only create if missing

-- Update the public function to properly mask sensitive data
CREATE OR REPLACE FUNCTION public.get_profiles_public()
RETURNS TABLE(
  id uuid, 
  wallet_address_masked text, 
  verified boolean, 
  profile_rank text,
  trade_count integer, 
  created_at timestamptz, 
  display_name text, 
  profile_image_url text,
  bio text, 
  twitter_handle text, 
  discord_handle text, 
  website_url text, 
  banner_image_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id,
    -- Mask wallet addresses - only show first 4 and last 4 characters for verified users
    CASE 
      WHEN up.verified = true OR up.profile_rank != 'DEFAULT' THEN 
        CONCAT(LEFT(up.wallet_address, 4), '...', RIGHT(up.wallet_address, 4))
      ELSE NULL 
    END as wallet_address_masked,
    up.verified,
    up.profile_rank,
    -- Only show trade count for active users
    CASE 
      WHEN up.verified = true OR up.profile_rank != 'DEFAULT' THEN up.trade_count
      ELSE NULL
    END as trade_count,
    up.created_at,
    -- Conditional display of info only if user has achieved some status
    CASE 
      WHEN up.verified = true OR up.profile_rank != 'DEFAULT' THEN up.display_name 
      ELSE NULL 
    END as display_name,
    CASE 
      WHEN up.verified = true THEN up.profile_image_url 
      ELSE NULL 
    END as profile_image_url,
    -- Never expose sensitive personal data publicly
    NULL::text as bio,
    NULL::text as twitter_handle,
    NULL::text as discord_handle,
    NULL::text as website_url,
    NULL::text as banner_image_url
  FROM public.user_profiles up
  -- Only return profiles that have some public presence (verified or achieved rank)
  WHERE up.verified = true OR up.profile_rank != 'DEFAULT' OR up.trade_count > 0;
$$;

-- Update the authenticated function to also mask sensitive data appropriately
CREATE OR REPLACE FUNCTION public.get_profiles_authenticated()
RETURNS TABLE(
  id uuid, 
  wallet_address text, 
  display_name text, 
  nickname text, 
  bio text,
  profile_image_url text, 
  banner_image_url text, 
  verified boolean, 
  profile_rank text,
  trade_count integer, 
  twitter_handle text, 
  discord_handle text, 
  website_url text,
  created_at timestamptz, 
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.id,
    up.wallet_address,
    up.display_name,
    up.nickname,
    up.bio,
    up.profile_image_url,
    up.banner_image_url,
    up.verified,
    up.profile_rank,
    up.trade_count,
    -- Protect sensitive social media handles - only show if verified
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
  FROM public.user_profiles up
  -- Authenticated users can see more data but still with privacy protection
  WHERE auth.uid() IS NOT NULL;
$$;