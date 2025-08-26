-- Fix Wallet Address Exposure: Secure Public Access Through Masking Functions Only
-- Remove direct table access and force use of secure functions

-- Drop all existing public policies that might exist
DROP POLICY IF EXISTS "Public users can view marketplace NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Public users can view marketplace collections" ON public.collections;  
DROP POLICY IF EXISTS "Public users can view basic creator profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public users can view collection like activity" ON public.collection_likes;
DROP POLICY IF EXISTS "Public users can view NFT like activity" ON public.nft_likes;
DROP POLICY IF EXISTS "Public users can view creator follow activity" ON public.creator_follows;
DROP POLICY IF EXISTS "Public users can view like counts only" ON public.collection_likes;
DROP POLICY IF EXISTS "Public users can view NFT like counts only" ON public.nft_likes;
DROP POLICY IF EXISTS "Public users can view follow counts only" ON public.creator_follows;

-- Grant execute permissions on secure functions to anonymous users
-- These functions already mask sensitive wallet address data
GRANT EXECUTE ON FUNCTION public.get_nfts_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_collections_public_masked() TO anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_activities_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_boosted_listings_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_info_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_collection_like_counts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_follow_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_collection_like_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creator_nft_like_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_creators_public_stats() TO anon;

-- Add comprehensive security comment
COMMENT ON FUNCTION public.get_nfts_public() IS 'Public function for anonymous marketplace browsing with wallet addresses masked for privacy';
COMMENT ON FUNCTION public.get_collections_public_masked() IS 'Public function for anonymous collection browsing with creator/treasury addresses masked';
COMMENT ON FUNCTION public.get_profiles_public() IS 'Public function showing limited profile data without exposing sensitive information';