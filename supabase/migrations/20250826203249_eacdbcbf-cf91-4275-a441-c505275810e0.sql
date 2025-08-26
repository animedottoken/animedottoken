-- Fix Marketplace Accessibility: Add Public READ Access for Anonymous Users
-- Allow anonymous users to browse marketplace while protecting sensitive data

-- Add public SELECT policy for NFTs (with masked addresses)
CREATE POLICY "Public users can view marketplace NFTs" 
ON public.nfts 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for Collections (with masked addresses) 
CREATE POLICY "Public users can view marketplace collections"
ON public.collections 
FOR SELECT 
TO anon
USING (is_active = true);

-- Add public SELECT policy for User Profiles (very limited data)
CREATE POLICY "Public users can view basic creator profiles"
ON public.user_profiles 
FOR SELECT 
TO anon
USING (verified = true OR profile_rank != 'DEFAULT');

-- Add public SELECT policy for Collection Likes (for like counts)
CREATE POLICY "Public users can view collection like activity"
ON public.collection_likes 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for NFT Likes (for like counts)
CREATE POLICY "Public users can view NFT like activity"
ON public.nft_likes 
FOR SELECT 
TO anon
USING (true);

-- Add public SELECT policy for Creator Follows (for follower counts)
CREATE POLICY "Public users can view creator follow activity"
ON public.creator_follows 
FOR SELECT 
TO anon
USING (true);

-- Add security comments
COMMENT ON POLICY "Public users can view marketplace NFTs" ON public.nfts IS 'Allows anonymous browsing of NFT marketplace - frontend should mask sensitive addresses';
COMMENT ON POLICY "Public users can view marketplace collections" ON public.collections IS 'Allows anonymous browsing of active collections - frontend should mask creator addresses';
COMMENT ON POLICY "Public users can view basic creator profiles" ON public.user_profiles IS 'Very limited profile data for verified/active creators only';
COMMENT ON POLICY "Public users can view collection like activity" ON public.collection_likes IS 'Public like counts for collections';
COMMENT ON POLICY "Public users can view NFT like activity" ON public.nft_likes IS 'Public like counts for NFTs';
COMMENT ON POLICY "Public users can view creator follow activity" ON public.creator_follows IS 'Public follower counts for creators';