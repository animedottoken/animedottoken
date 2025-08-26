-- Address remaining security issues while maintaining marketplace functionality

-- 1. Remove direct public access to NFTs table 
-- NFT data will be accessed via get_nfts_public() function which masks sensitive addresses
DROP POLICY IF EXISTS "Public can view NFTs" ON public.nfts;

-- 2. Remove direct public access to collections table
-- Collection data will be accessed via get_collections_public_masked() function  
DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;

-- 3. Remove any remaining public policies on marketplace_settings
DROP POLICY IF EXISTS "Authenticated users can view marketplace fees" ON public.marketplace_settings;

-- 4. Create restrictive policies that force use of security definer functions
-- These policies prevent direct table access while allowing controlled access via functions

-- NFTs: Only allow access to own or system-controlled data
CREATE POLICY "Users can view their own NFTs only"
ON public.nfts
FOR SELECT
USING (
  (owner_address = (auth.jwt() ->> 'wallet_address'::text)) OR 
  (creator_address = (auth.jwt() ->> 'wallet_address'::text)) OR
  (auth.role() = 'service_role'::text)
);

-- Collections: Only allow access to own collections
CREATE POLICY "Users can view their own collections only" 
ON public.collections
FOR SELECT
USING (
  (creator_address = (auth.jwt() ->> 'wallet_address'::text)) OR
  (auth.role() = 'service_role'::text)
);

-- Marketplace settings: Authenticated users only
CREATE POLICY "Authenticated users can view marketplace settings"
ON public.marketplace_settings  
FOR SELECT
TO authenticated
USING (true);

-- 5. Ensure public functions with SECURITY DEFINER can still provide masked data
-- The following functions will continue to work and provide properly masked public data:
-- - get_nfts_public() - masks owner/creator addresses
-- - get_collections_public_masked() - masks creator/treasury addresses  
-- - get_marketplace_info_public() - provides only fee percentage
-- - get_marketplace_fees_public() - provides only fee data

-- Note: This approach maintains marketplace functionality while protecting sensitive data
-- Public browsing works via security definer functions that mask wallet addresses