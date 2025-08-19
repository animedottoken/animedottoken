-- Ensure NFTs table is ready for minting integration
-- Add any missing columns and update RLS policies

-- Add trigger to update timestamps
CREATE TRIGGER update_nfts_updated_at
BEFORE UPDATE ON public.nfts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better marketplace performance
CREATE INDEX IF NOT EXISTS idx_nfts_collection_id ON public.nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner_address ON public.nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_nfts_is_listed ON public.nfts(is_listed);
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON public.nfts(created_at DESC);

-- Add index for marketplace activities
CREATE INDEX IF NOT EXISTS idx_marketplace_activities_collection_id ON public.marketplace_activities(collection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_activities_created_at ON public.marketplace_activities(created_at DESC);