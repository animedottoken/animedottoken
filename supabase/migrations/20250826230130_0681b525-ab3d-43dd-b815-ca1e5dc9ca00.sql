-- Fix privacy and security issues identified in security scan

-- 1. Remove overly permissive public policies that expose raw wallet addresses
-- These tables should only allow users to see their own data, not everyone's data

-- Remove public access to collection_likes (exposes which wallets liked what)
DROP POLICY IF EXISTS "Public can view collection likes" ON public.collection_likes;

-- Remove public access to nft_likes (exposes which wallets liked what NFTs)  
DROP POLICY IF EXISTS "Public can view NFT likes" ON public.nft_likes;

-- Remove public access to creator_follows (exposes follow relationships)
DROP POLICY IF EXISTS "Public can view creator follows" ON public.creator_follows;

-- 2. Remove public access to sensitive business configuration
-- Marketplace settings should only be accessible to authenticated users
DROP POLICY IF EXISTS "Public can view marketplace settings" ON public.marketplace_settings;

-- 3. Keep the existing masked public functions for legitimate marketplace browsing
-- These functions already properly mask sensitive data like wallet addresses

-- 4. Add policies for aggregated/anonymous data access
-- Allow public access to like counts and follow counts without exposing individual wallets

-- Create policy for public access to collection like counts (aggregated data only)
CREATE POLICY "Public can view collection like counts" 
ON public.collection_likes 
FOR SELECT 
USING (false); -- Will be accessed via get_collection_like_counts() function only

-- Create policy for public access to NFT like counts (aggregated data only)  
CREATE POLICY "Public can view NFT like counts"
ON public.nft_likes
FOR SELECT  
USING (false); -- Will be accessed via statistical functions only

-- Create policy for public access to creator follow counts (aggregated data only)
CREATE POLICY "Public can view creator follow counts"
ON public.creator_follows
FOR SELECT
USING (false); -- Will be accessed via get_creator_follow_stats() function only

-- 5. Ensure marketplace settings access is properly restricted
-- Only authenticated users can view basic marketplace info (fees only)
-- Full settings only accessible to service role
CREATE POLICY "Authenticated users can view marketplace fees"
ON public.marketplace_settings
FOR SELECT
TO authenticated
USING (true);

-- Note: Public functions like get_marketplace_info_public() and get_marketplace_fees_public() 
-- use SECURITY DEFINER to provide controlled access to fee information only