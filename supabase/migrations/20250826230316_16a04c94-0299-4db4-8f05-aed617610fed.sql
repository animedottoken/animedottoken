-- Fix remaining security issues and restore marketplace functionality

-- 1. Fix conflicting marketplace_settings policies
-- Remove the authenticated user policy and keep only service role access
-- Public data will be accessed via get_marketplace_info_public() function
DROP POLICY IF EXISTS "Authenticated users can view marketplace settings" ON public.marketplace_settings;

-- 2. Fix marketplace_activities table - should not be publicly readable
-- Remove public policy and keep only user-specific access
DROP POLICY IF EXISTS "Public can view marketplace activities" ON public.marketplace_activities;

-- Ensure only users involved in activities can see them
CREATE POLICY "Users can view activities they're involved in"
ON public.marketplace_activities
FOR SELECT
USING (
  (from_address = (auth.jwt() ->> 'wallet_address'::text)) OR 
  (to_address = (auth.jwt() ->> 'wallet_address'::text)) OR
  (auth.role() = 'service_role'::text)
);

-- 3. Fix overly restrictive social feature policies
-- Replace the policies that use "false" with ones that work with security definer functions

-- Fix collection likes - allow access via security definer functions
DROP POLICY IF EXISTS "Public can view collection like counts" ON public.collection_likes;

-- Fix NFT likes - allow access via security definer functions  
DROP POLICY IF EXISTS "Public can view NFT like counts" ON public.nft_likes;

-- Fix creator follows - allow access via security definer functions
DROP POLICY IF EXISTS "Public can view creator follow counts" ON public.creator_follows;

-- 4. The existing security definer functions provide the right balance:
-- - get_collection_like_counts() - provides aggregate counts without exposing individual users
-- - get_creator_follow_stats() - provides follow counts without exposing individual followers
-- - get_creators_public_stats() - provides creator statistics safely
-- - get_marketplace_activities_public() - provides masked trading data
-- - get_marketplace_info_public() - provides only fee percentage

-- These functions use SECURITY DEFINER to bypass RLS and provide controlled public access
-- while protecting sensitive user data like wallet addresses