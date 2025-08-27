-- Create public policies for marketplace viewing
-- Allow anonymous users to view listed NFTs
CREATE POLICY "Public can view listed NFTs for marketplace" 
ON nfts 
FOR SELECT 
TO anon 
USING (is_listed = true);

-- Allow anonymous users to view active collections for marketplace  
CREATE POLICY "Public can view active collections for marketplace" 
ON collections 
FOR SELECT 
TO anon 
USING (is_active = true AND is_live = true);

-- Allow authenticated users to view listed NFTs (in addition to their own)
CREATE POLICY "Authenticated users can view listed NFTs" 
ON nfts 
FOR SELECT 
TO authenticated 
USING (is_listed = true OR owner_address = (auth.jwt() ->> 'wallet_address'::text) OR creator_address = (auth.jwt() ->> 'wallet_address'::text));

-- Allow authenticated users to view active collections (in addition to their own)
CREATE POLICY "Authenticated users can view active collections" 
ON collections 
FOR SELECT 
TO authenticated 
USING (is_active = true AND is_live = true OR creator_address = (auth.jwt() ->> 'wallet_address'::text));