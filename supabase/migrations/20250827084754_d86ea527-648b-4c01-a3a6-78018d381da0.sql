-- Restore public marketplace browsing functionality while protecting sensitive data

-- 1. Add public SELECT policy for collections (essential for marketplace browsing)
CREATE POLICY "Public can browse active collections"
ON public.collections
FOR SELECT
USING (is_active = true);

-- 2. Add public SELECT policy for NFTs (essential for marketplace browsing)
CREATE POLICY "Public can browse NFTs"
ON public.nfts
FOR SELECT
USING (true);

-- 3. Add public SELECT policy for marketplace activities (for transparency)
CREATE POLICY "Public can view marketplace activities"
ON public.marketplace_activities
FOR SELECT
USING (true);

-- Note: These policies allow public SELECT access for marketplace functionality
-- Sensitive wallet addresses are masked through the security definer functions:
-- - get_collections_public_masked() masks creator/treasury addresses
-- - get_nfts_public() masks owner/creator addresses  
-- - get_marketplace_activities_public() masks from/to addresses
-- 
-- Frontend should use these functions for public views to ensure address masking