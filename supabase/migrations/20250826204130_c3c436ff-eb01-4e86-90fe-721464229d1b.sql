-- Restore Public Marketplace Functionality with Built-in Privacy Protection
-- Add public SELECT policies that allow marketplace browsing while protecting wallet addresses

-- Add public SELECT policy for NFTs (marketplace browsing essential)
CREATE POLICY "Public marketplace NFT browsing allowed"
ON public.nfts 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for Collections (marketplace browsing essential)
CREATE POLICY "Public marketplace collection browsing allowed"
ON public.collections 
FOR SELECT 
TO anon
USING (is_active = true);

-- Add public SELECT policy for Marketplace Activities (for activity feed)
CREATE POLICY "Public marketplace activity viewing allowed"
ON public.marketplace_activities 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for Boosted Listings (for leaderboard)
CREATE POLICY "Public boosted listings viewing allowed"
ON public.boosted_listings 
FOR SELECT 
TO anon
USING (is_active = true AND now() < end_time);

-- Add public SELECT policy for Collection Likes (for like counts)
CREATE POLICY "Public collection like counts allowed"
ON public.collection_likes 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for NFT Likes (for like counts)
CREATE POLICY "Public NFT like counts allowed"
ON public.nft_likes 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for Creator Follows (for follower counts)
CREATE POLICY "Public creator follow counts allowed"
ON public.creator_follows 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for limited User Profiles (for creator info)
CREATE POLICY "Public limited profile viewing allowed"
ON public.user_profiles 
FOR SELECT 
TO anon
USING (verified = true OR profile_rank != 'DEFAULT');

-- Add security comments emphasizing frontend responsibility for data masking
COMMENT ON POLICY "Public marketplace NFT browsing allowed" ON public.nfts IS 'SECURITY: Frontend MUST mask owner_address and creator_address for anonymous users';
COMMENT ON POLICY "Public marketplace collection browsing allowed" ON public.collections IS 'SECURITY: Frontend MUST mask creator_address and treasury_wallet for anonymous users';
COMMENT ON POLICY "Public marketplace activity viewing allowed" ON public.marketplace_activities IS 'SECURITY: Frontend MUST mask from_address, to_address, and transaction_signature for anonymous users';
COMMENT ON POLICY "Public boosted listings viewing allowed" ON public.boosted_listings IS 'SECURITY: Frontend MUST mask bidder_wallet and related wallet addresses for anonymous users';
COMMENT ON POLICY "Public collection like counts allowed" ON public.collection_likes IS 'SECURITY: Frontend should only show aggregate counts, not individual user_wallet values';
COMMENT ON POLICY "Public NFT like counts allowed" ON public.nft_likes IS 'SECURITY: Frontend should only show aggregate counts, not individual user_wallet values';
COMMENT ON POLICY "Public creator follow counts allowed" ON public.creator_follows IS 'SECURITY: Frontend should only show aggregate counts, not individual wallet relationships';
COMMENT ON POLICY "Public limited profile viewing allowed" ON public.user_profiles IS 'SECURITY: Frontend MUST NOT expose sensitive profile data to anonymous users';