-- Fix critical RLS vulnerabilities on user_profiles table
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view limited public profiles only" ON public.user_profiles;

-- Create secure RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT 
WITH CHECK (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
WITH CHECK (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

-- Service role can manage all profiles (for edge functions with proper validation)
CREATE POLICY "Service role can manage profiles" ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Add public read access through RPC function for safe profile discovery
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
  wallet_address text,
  display_name text,
  profile_image_url text,
  verified boolean,
  profile_rank text,
  trade_count integer,
  created_at timestamp with time zone
) 
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.wallet_address,
    -- Only show display name if user is verified or has rank above DEFAULT
    CASE 
      WHEN up.verified = true OR up.profile_rank != 'DEFAULT' THEN up.display_name 
      ELSE NULL 
    END as display_name,
    -- Only show profile image if verified
    CASE 
      WHEN up.verified = true THEN up.profile_image_url 
      ELSE NULL 
    END as profile_image_url,
    up.verified,
    up.profile_rank,
    up.trade_count,
    up.created_at
  FROM public.user_profiles up
  WHERE up.verified = true OR up.profile_rank != 'DEFAULT' OR up.trade_count > 0;
$$;