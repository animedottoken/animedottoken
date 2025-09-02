-- 1) Make wallet columns optional for social actions
ALTER TABLE public.creator_follows
  ALTER COLUMN follower_wallet DROP NOT NULL;

ALTER TABLE public.collection_likes
  ALTER COLUMN user_wallet DROP NOT NULL;

ALTER TABLE public.nft_likes
  ALTER COLUMN user_wallet DROP NOT NULL;

-- 2) Add idempotency/uniqueness on user_id (not wallet), so users can't like/follow the same thing twice
-- These indexes allow multiple NULL user_id rows (unlikely), which is acceptable. 
-- The app always sets user_id for authenticated actions.

-- Prevent duplicate follows per user -> creator
CREATE UNIQUE INDEX IF NOT EXISTS uniq_creator_follows_user_creator
  ON public.creator_follows (user_id, creator_wallet);

-- Prevent duplicate collection likes per user -> collection
CREATE UNIQUE INDEX IF NOT EXISTS uniq_collection_likes_user_collection
  ON public.collection_likes (user_id, collection_id);

-- Prevent duplicate NFT likes per user -> nft
CREATE UNIQUE INDEX IF NOT EXISTS uniq_nft_likes_user_nft
  ON public.nft_likes (user_id, nft_id);