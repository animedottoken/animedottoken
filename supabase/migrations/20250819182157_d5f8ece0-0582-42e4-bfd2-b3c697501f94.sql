-- Add indexes for better marketplace performance (skip trigger as it already exists)
CREATE INDEX IF NOT EXISTS idx_nfts_collection_id ON public.nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner_address ON public.nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_nfts_is_listed ON public.nfts(is_listed);
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON public.nfts(created_at DESC);

-- Add index for marketplace activities
CREATE INDEX IF NOT EXISTS idx_marketplace_activities_collection_id ON public.marketplace_activities(collection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_activities_created_at ON public.marketplace_activities(created_at DESC);