-- Add public read policies for marketplace functionality
-- This allows anonymous users to browse NFTs and collections

-- Public read access for collections (masked addresses)
CREATE POLICY "Public can view active collections" ON public.collections 
FOR SELECT USING (is_active = true);

-- Public read access for NFTs (masked addresses) 
CREATE POLICY "Public can view NFTs" ON public.nfts 
FOR SELECT USING (true);

-- Public read access for marketplace activities (masked addresses)
CREATE POLICY "Public can view marketplace activities" ON public.marketplace_activities 
FOR SELECT USING (true);

-- Public read access for marketplace settings
CREATE POLICY "Public can view marketplace settings" ON public.marketplace_settings 
FOR SELECT USING (true);

-- Public read access for user profiles (limited data)
CREATE POLICY "Public can view basic profile info" ON public.user_profiles 
FOR SELECT USING (verified = true OR profile_rank != 'DEFAULT' OR trade_count > 0);

-- Public read access for collection likes count
CREATE POLICY "Public can view collection likes" ON public.collection_likes 
FOR SELECT USING (true);

-- Public read access for NFT likes count
CREATE POLICY "Public can view NFT likes" ON public.nft_likes 
FOR SELECT USING (true);

-- Public read access for creator follows count
CREATE POLICY "Public can view creator follows" ON public.creator_follows 
FOR SELECT USING (true);

-- Public read access for boosted listings
CREATE POLICY "Public can view boosted listings" ON public.boosted_listings 
FOR SELECT USING (is_active = true AND now() < end_time);