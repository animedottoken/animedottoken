-- Final Security Fix: Force All Public Access Through Secure Masking Functions
-- Remove direct public table access that exposes wallet addresses

-- Remove all public SELECT policies that expose raw data
DROP POLICY IF EXISTS "Public marketplace NFT browsing allowed" ON public.nfts;
DROP POLICY IF EXISTS "Public marketplace collection browsing allowed" ON public.collections;
DROP POLICY IF EXISTS "Public marketplace activity viewing allowed" ON public.marketplace_activities;
DROP POLICY IF EXISTS "Public boosted listings viewing allowed" ON public.boosted_listings;
DROP POLICY IF EXISTS "Public collection like counts allowed" ON public.collection_likes;
DROP POLICY IF EXISTS "Public NFT like counts allowed" ON public.nft_likes;
DROP POLICY IF EXISTS "Public creator follow counts allowed" ON public.creator_follows;
DROP POLICY IF EXISTS "Public limited profile viewing allowed" ON public.user_profiles;

-- Ensure all secure masking functions are available to anonymous users
-- These functions already mask wallet addresses and sensitive data
GRANT EXECUTE ON FUNCTION public.get_nfts_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_collections_public_masked() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_activities_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_boosted_listings_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_info_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_collection_like_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_follow_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_collection_like_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_nft_like_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creators_public_stats() TO anon, authenticated;

-- Create a public function for marketplace settings (non-sensitive data only)
CREATE OR REPLACE FUNCTION public.get_marketplace_fees_public()
RETURNS TABLE(platform_fee_percentage numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ms.platform_fee_percentage
  FROM public.marketplace_settings ms
  ORDER BY ms.updated_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_fees_public() TO anon, authenticated;

-- Update function descriptions for clarity
COMMENT ON FUNCTION public.get_nfts_public() IS 'SECURE: Returns NFT marketplace data with owner/creator addresses masked as xxx...xxx for privacy';
COMMENT ON FUNCTION public.get_collections_public_masked() IS 'SECURE: Returns collection data with creator/treasury addresses masked as xxx...xxx for privacy';
COMMENT ON FUNCTION public.get_marketplace_activities_public() IS 'SECURE: Returns trading activity with all wallet addresses and transaction signatures masked';
COMMENT ON FUNCTION public.get_boosted_listings_public() IS 'SECURE: Returns boost leaderboard with all wallet addresses masked for privacy';
COMMENT ON FUNCTION public.get_collection_like_counts() IS 'SECURE: Returns only aggregate like counts per collection, no individual wallet data exposed';
COMMENT ON FUNCTION public.get_creator_follow_stats() IS 'SECURE: Returns only aggregate follower counts per creator, no individual follower wallets exposed';
COMMENT ON FUNCTION public.get_marketplace_fees_public() IS 'SECURE: Returns only platform fee percentage, no wallet addresses or sensitive settings';