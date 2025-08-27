-- Fix critical security issue: Remove public access to sensitive NFT wallet addresses

-- 1. Remove the overly permissive public SELECT policy on NFTs table
-- This prevents direct access to owner_address and creator_address fields
DROP POLICY IF EXISTS "Public can browse NFTs" ON public.nfts;

-- 2. Similarly, remove overly permissive public access to collections table
-- This prevents direct access to creator_address and treasury_wallet fields  
DROP POLICY IF EXISTS "Public can browse active collections" ON public.collections;

-- Note: Public marketplace browsing will continue to work through secure functions:
-- - get_nfts_public() masks owner_address_masked and creator_address_masked
-- - get_collections_public_masked() masks creator_address_masked and treasury_wallet_masked
-- - get_marketplace_activities_public() masks from_address_masked and to_address_masked
--
-- These functions provide controlled public access with address masking for privacy
-- while the direct table policies protect against wallet address harvesting

-- 3. Ensure authenticated users can still access their own data
-- (These policies should already exist, but let's make sure)

-- Users can view their own NFTs (owner or creator)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'nfts' 
        AND policyname = 'Owners and creators can view their NFTs'
    ) THEN
        CREATE POLICY "Owners and creators can view their NFTs"
        ON public.nfts
        FOR SELECT
        USING (
            (owner_address = (auth.jwt() ->> 'wallet_address'::text)) OR 
            (creator_address = (auth.jwt() ->> 'wallet_address'::text))
        );
    END IF;
END $$;

-- Users can view their own collections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collections' 
        AND policyname = 'Creators can view their own collections'
    ) THEN
        CREATE POLICY "Creators can view their own collections"
        ON public.collections
        FOR SELECT
        USING (creator_address = (auth.jwt() ->> 'wallet_address'::text));
    END IF;
END $$;