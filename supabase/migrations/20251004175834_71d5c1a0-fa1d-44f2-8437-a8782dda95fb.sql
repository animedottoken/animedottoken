-- Drop the overly permissive RLS policy that allows any authenticated user
-- to view all public profiles, which enables data scraping
DROP POLICY IF EXISTS "Authenticated users can view limited public profiles" ON public.user_profiles;

-- Note: Users can still access public profile data via secure RPC functions:
-- - get_public_profile_limited(wallet_address)
-- - get_creators_public_explore()
-- These functions return only safe, limited fields and prevent bulk scraping