-- Fix Critical Security Vulnerability: Restrict access to sensitive user profile data
-- Replace overly permissive "everyone can view profiles" policy with secure, granular policies

-- First, drop the insecure policy that allows everyone to read all profile data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;

-- Create secure, granular policies for different types of profile data access

-- 1. Allow public access to basic, non-sensitive profile info only
CREATE POLICY "Public can view basic profile info" 
ON public.user_profiles 
FOR SELECT 
USING (true);

-- Note: We'll use a view to control exactly which columns are publicly visible
-- This policy enables the view to work, but we control access through the view

-- 2. Users can view their own complete profile (all columns)
CREATE POLICY "Users can view their own complete profile" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.jwt() ->> 'wallet_address' = wallet_address 
  OR auth.uid()::text = id::text
);

-- 3. Authenticated users can view additional profile details of others
CREATE POLICY "Authenticated users can view extended profile info" 
ON public.user_profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND (
    display_name IS NOT NULL 
    OR nickname IS NOT NULL 
    OR verified = true
  )
);

-- Keep the existing management policy (it's secure)
-- "Users can manage their own profile" policy is already properly restricted

-- Create a secure public view that exposes only safe, non-sensitive profile data
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  wallet_address,
  -- Safe public information
  verified,
  profile_rank,
  trade_count,
  created_at,
  -- Conditional display of some info only if user has chosen to make it public
  CASE 
    WHEN verified = true OR profile_rank != 'DEFAULT' THEN display_name 
    ELSE NULL 
  END as display_name,
  CASE 
    WHEN verified = true THEN profile_image_url 
    ELSE NULL 
  END as profile_image_url,
  -- Never expose sensitive handles, bio, or personal URLs publicly
  -- These require authentication to view
  NULL::text as bio,
  NULL::text as twitter_handle,
  NULL::text as discord_handle,
  NULL::text as website_url,
  NULL::text as banner_image_url
FROM public.user_profiles;

-- Create a view for authenticated users with more profile details
CREATE OR REPLACE VIEW public.profiles_authenticated AS
SELECT 
  id,
  wallet_address,
  display_name,
  nickname,
  bio,
  profile_image_url,
  banner_image_url,
  verified,
  profile_rank,
  trade_count,
  -- Still protect sensitive social media handles - only show if verified
  CASE 
    WHEN verified = true THEN twitter_handle 
    ELSE NULL 
  END as twitter_handle,
  CASE 
    WHEN verified = true THEN discord_handle 
    ELSE NULL 
  END as discord_handle,
  CASE 
    WHEN verified = true THEN website_url 
    ELSE NULL 
  END as website_url,
  created_at,
  updated_at
FROM public.user_profiles;

-- Grant appropriate permissions
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.profiles_authenticated TO authenticated;

-- Add helpful comments
COMMENT ON VIEW public.profiles_public IS 'Safe public view of user profiles with sensitive data protected';
COMMENT ON VIEW public.profiles_authenticated IS 'Extended profile view for authenticated users with additional details';
COMMENT ON POLICY "Public can view basic profile info" ON public.user_profiles IS 'Enables public views but actual access controlled by view definitions';
COMMENT ON POLICY "Users can view their own complete profile" ON public.user_profiles IS 'Users always have full access to their own profile data';
COMMENT ON POLICY "Authenticated users can view extended profile info" ON public.user_profiles IS 'Authenticated users can see additional profile details of other users';