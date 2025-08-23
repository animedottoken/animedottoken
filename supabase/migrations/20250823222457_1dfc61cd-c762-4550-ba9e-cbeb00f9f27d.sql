-- Add "featured" support to NFTs
ALTER TABLE public.nfts
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamp with time zone;

-- Add views column for trending calculation
ALTER TABLE public.nfts
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_nfts_is_featured ON public.nfts (is_featured);
CREATE INDEX IF NOT EXISTS idx_nfts_featured_at ON public.nfts (featured_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_nfts_views ON public.nfts (views DESC);
CREATE INDEX IF NOT EXISTS idx_nfts_created_at ON public.nfts (created_at DESC);