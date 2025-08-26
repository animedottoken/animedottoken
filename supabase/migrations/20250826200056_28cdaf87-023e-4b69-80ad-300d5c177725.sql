-- Fix the new Security Definer View warnings for profile views
-- Convert them to security invoker functions to maintain proper security context

-- Drop the views that are causing security warnings
DROP VIEW IF EXISTS public.profiles_authenticated;
DROP VIEW IF EXISTS public.profiles_public;

-- Create secure functions instead of views
CREATE OR REPLACE FUNCTION public.get_profiles_public()
RETURNS TABLE(
  id uuid, wallet_address text, verified boolean, profile_rank text,
  trade_count integer, created_at timestamptz, display_name text, profile_image_url text,
  bio text, twitter_handle text, discord_handle text, website_url text, banner_image_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    up.id,
    up.wallet_address,
    up.verified,
    up.profile_rank,
    up.trade_count,
    up.created_at,
    -- Conditional display of some info only if user has chosen to make it public
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
  id uuid, wallet_address text, display_name text, nickname text, bio text,
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
    up.wallet_address,
    up.display_name,
    up.nickname,
    up.bio,
    up.profile_image_url,
    up.banner_image_url,
    up.verified,
    up.profile_rank,
    up.trade_count,
    -- Still protect sensitive social media handles - only show if verified
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_profiles_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_authenticated() TO authenticated;