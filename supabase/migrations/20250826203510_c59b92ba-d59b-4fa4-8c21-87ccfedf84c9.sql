-- Fix Wallet Address Exposure: Remove Direct Public Access to Sensitive Tables
-- Force public access through secure masking functions only

-- Remove public access to tables that expose wallet addresses
DROP POLICY IF EXISTS "Public users can view marketplace NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Public users can view marketplace collections" ON public.collections;
DROP POLICY IF EXISTS "Public users can view basic creator profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public users can view collection like activity" ON public.collection_likes;
DROP POLICY IF EXISTS "Public users can view NFT like activity" ON public.nft_likes;
DROP POLICY IF EXISTS "Public users can view creator follow activity" ON public.creator_follows;

-- Create restrictive public policies that only allow access to non-sensitive aggregate data
-- For like counts and follower counts without exposing wallet addresses

-- Allow public access to like counts (but not wallet addresses)
CREATE POLICY "Public users can view like counts only"
ON public.collection_likes 
FOR SELECT 
TO anon
USING (false); -- Block direct access, force use of aggregate functions

CREATE POLICY "Public users can view NFT like counts only"
ON public.nft_likes 
FOR SELECT 
TO anon
USING (false); -- Block direct access, force use of aggregate functions

CREATE POLICY "Public users can view follow counts only"
ON public.creator_follows 
FOR SELECT 
TO anon
USING (false); -- Block direct access, force use of aggregate functions

-- Update existing secure functions to be accessible by anonymous users
GRANT EXECUTE ON FUNCTION public.get_nfts_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_collections_public_masked() TO anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_collection_like_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_follow_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_collection_like_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_nft_like_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creators_public_stats() TO anon;

-- Add security comments
COMMENT ON POLICY "Public users can view like counts only" ON public.collection_likes IS 'Blocks direct table access - public users must use aggregate functions that hide wallet addresses';
COMMENT ON POLICY "Public users can view NFT like counts only" ON public.nft_likes IS 'Blocks direct table access - public users must use aggregate functions that hide wallet addresses';
COMMENT ON POLICY "Public users can view follow counts only" ON public.creator_follows IS 'Blocks direct table access - public users must use aggregate functions that hide wallet addresses';