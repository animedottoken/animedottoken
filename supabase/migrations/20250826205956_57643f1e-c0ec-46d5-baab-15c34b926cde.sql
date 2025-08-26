-- Add public read policies for core marketplace functionality

-- Allow public read access to collections (basic marketplace browsing)
CREATE POLICY "Public can view active collections"
ON public.collections
FOR SELECT
USING (is_active = true);

-- Allow public read access to NFTs (marketplace browsing)
CREATE POLICY "Public can view all NFTs"
ON public.nfts
FOR SELECT
USING (true);

-- Allow public read access to marketplace activities (price discovery, trading history)
CREATE POLICY "Public can view marketplace activities"
ON public.marketplace_activities
FOR SELECT
USING (true);

-- Allow public read access to basic user profiles (creator discovery)
CREATE POLICY "Public can view basic user profiles"
ON public.user_profiles
FOR SELECT
USING (true);

-- Allow public read access to marketplace settings (fee transparency)
CREATE POLICY "Public can view marketplace settings"
ON public.marketplace_settings
FOR SELECT
USING (true);