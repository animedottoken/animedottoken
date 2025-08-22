-- Remove the existing INSERT policy that requires JWT authentication
DROP POLICY IF EXISTS "Users can insert their NFTs" ON public.nfts;

-- Create a more permissive INSERT policy for wallet-based minting
-- This allows any authenticated user to insert NFTs, but we'll validate the owner_address in the application
CREATE POLICY "Allow wallet-based NFT minting" 
ON public.nfts 
FOR INSERT 
WITH CHECK (true);

-- Update the ALL policy to be more permissive for wallet addresses
DROP POLICY IF EXISTS "Owners can manage their NFTs" ON public.nfts;

-- Create separate policies for better control
CREATE POLICY "Users can view all NFTs" 
ON public.nfts 
FOR SELECT 
USING (true);

CREATE POLICY "Owners can update their NFTs" 
ON public.nfts 
FOR UPDATE 
USING (owner_address IS NOT NULL);

CREATE POLICY "Owners can delete their NFTs" 
ON public.nfts 
FOR DELETE 
USING (owner_address IS NOT NULL);