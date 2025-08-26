-- Fix Critical Security Vulnerabilities: mint_jobs, user_profiles, marketplace_settings
-- Handle existing policies properly

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
-- Note: "Users can view their own complete profile" already exists - keeping it

-- Create additional restrictive policy for user_profiles
CREATE POLICY "Authenticated users can view verified profiles only" 
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

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_marketplace_info_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_settings_authenticated() TO authenticated;

-- Add security comments
COMMENT ON POLICY "Users can only view their own mint jobs" ON public.mint_jobs IS 'Restricts mint job access to wallet owner only - prevents wallet address exposure';
COMMENT ON POLICY "Authenticated users can view verified profiles only" ON public.user_profiles IS 'Authenticated users can see limited profile data from verified/high-ranking users only';
COMMENT ON POLICY "Only authenticated users can view marketplace settings" ON public.marketplace_settings IS 'Restricts access to platform financial information to authenticated users only';

COMMENT ON FUNCTION public.get_marketplace_info_public() IS 'Public function providing only non-sensitive marketplace information (fee percentage)';
COMMENT ON FUNCTION public.get_marketplace_settings_authenticated() IS 'Authenticated function providing complete marketplace settings including platform wallet for transactions';