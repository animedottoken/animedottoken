-- Add metadata column to mint_job_items for storing per-NFT details
ALTER TABLE public.mint_job_items 
ADD COLUMN metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.mint_job_items.metadata IS 'Optional metadata for individual NFTs including image, name, description, and attributes';