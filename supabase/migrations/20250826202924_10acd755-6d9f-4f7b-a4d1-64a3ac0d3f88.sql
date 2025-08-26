-- Fix Critical Security Vulnerability: NFT Ownership Validation
-- Replace insecure policies that only check owner_address IS NOT NULL
-- with proper wallet address validation

-- Drop the insecure UPDATE policy
DROP POLICY IF EXISTS "Owners can update their NFTs" ON public.nfts;

-- Drop the insecure DELETE policy  
DROP POLICY IF EXISTS "Owners can delete their NFTs" ON public.nfts;

-- Create secure UPDATE policy with proper ownership validation
CREATE POLICY "Owners can update their own NFTs" 
ON public.nfts 
FOR UPDATE 
USING (owner_address = (auth.jwt() ->> 'wallet_address'))
WITH CHECK (owner_address = (auth.jwt() ->> 'wallet_address'));

-- Create secure DELETE policy with proper ownership validation
CREATE POLICY "Owners can delete their own NFTs" 
ON public.nfts 
FOR DELETE 
USING (owner_address = (auth.jwt() ->> 'wallet_address'));

-- Add security comments
COMMENT ON POLICY "Owners can update their own NFTs" ON public.nfts IS 'Ensures only the actual NFT owner (verified by wallet address) can update their NFT';
COMMENT ON POLICY "Owners can delete their own NFTs" ON public.nfts IS 'Ensures only the actual NFT owner (verified by wallet address) can delete their NFT';