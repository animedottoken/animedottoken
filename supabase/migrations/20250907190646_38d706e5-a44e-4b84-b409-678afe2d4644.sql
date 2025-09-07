-- Optional: Add network column to track which network (mainnet/devnet) each NFT and collection was minted on
-- This prevents devnet content from appearing in production views

-- Add network column to collections table
ALTER TABLE public.collections 
ADD COLUMN network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'devnet'));

-- Add network column to nfts table  
ALTER TABLE public.nfts 
ADD COLUMN network TEXT DEFAULT 'mainnet' CHECK (network IN ('mainnet', 'devnet'));

-- Create index for better performance when filtering by network
CREATE INDEX idx_collections_network ON public.collections(network);
CREATE INDEX idx_nfts_network ON public.nfts(network);

-- Update existing records to mainnet (assuming they were created on mainnet)
-- You may need to adjust this based on your actual data
UPDATE public.collections SET network = 'mainnet' WHERE network IS NULL;
UPDATE public.nfts SET network = 'mainnet' WHERE network IS NULL;