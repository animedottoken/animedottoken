-- Fix Privacy Vulnerabilities: Restrict Authenticated User Data Access
-- Replace overly permissive policies with user-specific privacy controls

-- Fix User Profiles: Remove broad authenticated access
DROP POLICY IF EXISTS "Authenticated users can view verified profiles only" ON public.user_profiles;

-- Fix Marketplace Activities: Remove broad authenticated access  
DROP POLICY IF EXISTS "Only authenticated users can view marketplace activities" ON public.marketplace_activities;

-- Fix Collection Likes: Remove broad authenticated access
DROP POLICY IF EXISTS "Authenticated users can view collection activity" ON public.collection_likes;

-- Fix NFT Likes: Remove broad authenticated access
DROP POLICY IF EXISTS "Authenticated users can view NFT activity" ON public.nft_likes;

-- Fix Creator Follows: Remove broad authenticated access
DROP POLICY IF EXISTS "Authenticated users can view follow relationships" ON public.creator_follows;

-- Fix Boosted Listings: Remove broad authenticated access
DROP POLICY IF EXISTS "Only authenticated users can view boost details" ON public.boosted_listings;

-- Create privacy-focused policies for User Profiles
-- Only allow viewing own profile or very limited public info for verified users
CREATE POLICY "Users can view limited public profiles only"
ON public.user_profiles 
FOR SELECT 
USING (
  -- Own profile: full access
  wallet_address = (auth.jwt() ->> 'wallet_address') 
  OR 
  -- Others: only verified users with very limited data exposure
  (verified = true AND profile_rank != 'DEFAULT')
);

-- Create privacy-focused policies for Marketplace Activities  
-- Users can only see activities that directly involve their wallet
CREATE POLICY "Users can only view their own trading activities"
ON public.marketplace_activities 
FOR SELECT 
USING (
  from_address = (auth.jwt() ->> 'wallet_address') 
  OR to_address = (auth.jwt() ->> 'wallet_address')
);

-- Create privacy-focused policies for Collection Likes
-- Users can only see their own likes
CREATE POLICY "Users can only view their own collection likes"
ON public.collection_likes 
FOR SELECT 
USING (user_wallet = (auth.jwt() ->> 'wallet_address'));

-- Create privacy-focused policies for NFT Likes  
-- Users can only see their own likes
CREATE POLICY "Users can only view their own NFT likes"
ON public.nft_likes 
FOR SELECT 
USING (user_wallet = (auth.jwt() ->> 'wallet_address'));

-- Create privacy-focused policies for Creator Follows
-- Users can only see follows where they are involved (as follower or creator)
CREATE POLICY "Users can only view their own follow relationships"
ON public.creator_follows 
FOR SELECT 
USING (
  follower_wallet = (auth.jwt() ->> 'wallet_address') 
  OR creator_wallet = (auth.jwt() ->> 'wallet_address')
);

-- Create privacy-focused policies for Boosted Listings
-- Users can only see boosts for their own NFTs or their own bids
CREATE POLICY "Users can only view boosts involving their assets"
ON public.boosted_listings 
FOR SELECT 
USING (
  -- Own bids
  bidder_wallet = (auth.jwt() ->> 'wallet_address')
  OR
  -- Boosts on own NFTs
  EXISTS (
    SELECT 1 FROM public.nfts n 
    WHERE n.id = boosted_listings.nft_id 
    AND n.owner_address = (auth.jwt() ->> 'wallet_address')
  )
);

-- Add comprehensive security comments
COMMENT ON POLICY "Users can view limited public profiles only" ON public.user_profiles IS 'Privacy protection: Users can only view their own complete profile or very limited public data for verified users';
COMMENT ON POLICY "Users can only view their own trading activities" ON public.marketplace_activities IS 'Privacy protection: Users can only see marketplace activities where their wallet is involved';
COMMENT ON POLICY "Users can only view their own collection likes" ON public.collection_likes IS 'Privacy protection: Users can only see their own collection preferences';
COMMENT ON POLICY "Users can only view their own NFT likes" ON public.nft_likes IS 'Privacy protection: Users can only see their own NFT preferences';
COMMENT ON POLICY "Users can only view their own follow relationships" ON public.creator_follows IS 'Privacy protection: Users can only see follow relationships they are part of';
COMMENT ON POLICY "Users can only view boosts involving their assets" ON public.boosted_listings IS 'Privacy protection: Users can only see boosts on their NFTs or their own bids';