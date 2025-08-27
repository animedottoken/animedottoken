
BEGIN;

-- 1) Clean existing likes
TRUNCATE TABLE public.nft_likes;
TRUNCATE TABLE public.collection_likes;

-- 2) Enforce uniqueness: one like per user per NFT/Collection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_nft_like'
  ) THEN
    ALTER TABLE public.nft_likes
      ADD CONSTRAINT unique_nft_like UNIQUE (nft_id, user_wallet);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_collection_like'
  ) THEN
    ALTER TABLE public.collection_likes
      ADD CONSTRAINT unique_collection_like UNIQUE (collection_id, user_wallet);
  END IF;
END$$;

-- 3) Helpful indexes for counts and lookups
CREATE INDEX IF NOT EXISTS idx_nft_likes_nft_id ON public.nft_likes (nft_id);
CREATE INDEX IF NOT EXISTS idx_collection_likes_collection_id ON public.collection_likes (collection_id);

-- 4) Ensure full row data for realtime payloads (helpful for DELETE events)
ALTER TABLE public.nft_likes REPLICA IDENTITY FULL;
ALTER TABLE public.collection_likes REPLICA IDENTITY FULL;

COMMIT;
