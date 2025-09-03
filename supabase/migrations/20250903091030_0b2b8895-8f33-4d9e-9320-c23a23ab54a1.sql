
-- 1) CREATOR FOLLOWS: remove wallet dependency, go user_id-only

-- Drop existing (wallet-based and mixed) policies
DROP POLICY IF EXISTS "Authenticated users can follow creators" ON public.creator_follows;
DROP POLICY IF EXISTS "Authenticated users can unfollow creators" ON public.creator_follows;
DROP POLICY IF EXISTS "Authenticated users can view their own follows" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can follow creators" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can only view their own follow relationships" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can unfollow creators" ON public.creator_follows;
DROP POLICY IF EXISTS "Users can view their own follows" ON public.creator_follows;

-- Use user_id semantics only: follower_user_id (who follows) and creator_user_id (who is followed)
-- If old column exists, rename it for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'creator_follows' AND column_name = 'user_id'
  )
  THEN
    ALTER TABLE public.creator_follows RENAME COLUMN user_id TO follower_user_id;
  END IF;
END$$;

-- Drop wallet columns entirely
ALTER TABLE public.creator_follows
  DROP COLUMN IF EXISTS follower_wallet,
  DROP COLUMN IF EXISTS creator_wallet;

-- Add creator_user_id (required)
ALTER TABLE public.creator_follows
  ADD COLUMN IF NOT EXISTS creator_user_id uuid NOT NULL;

-- Enforce no duplicate follow relations (self-follow is allowed; this just prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS creator_follows_unique_pair
  ON public.creator_follows (follower_user_id, creator_user_id);

-- Keep/ensure RLS enabled
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

-- New user-id-only policies
CREATE POLICY "Follows: users can create follows as themselves"
  ON public.creator_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Follows: users can delete their own follows"
  ON public.creator_follows
  FOR DELETE
  USING (auth.uid() = follower_user_id);

CREATE POLICY "Follows: users can view their follower/following relationships"
  ON public.creator_follows
  FOR SELECT
  USING (auth.uid() = follower_user_id OR auth.uid() = creator_user_id);


-- 2) NFT LIKES: remove wallet dependency, go user_id-only

-- Drop existing mixed policies
DROP POLICY IF EXISTS "Authenticated users can like NFTs" ON public.nft_likes;
DROP POLICY IF EXISTS "Authenticated users can unlike NFTs" ON public.nft_likes;
DROP POLICY IF EXISTS "Authenticated users can view their own NFT likes" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can like nfts" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can only view their own NFT likes" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can unlike nfts" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can view their own NFT likes" ON public.nft_likes;

-- Drop wallet column and require user_id
ALTER TABLE public.nft_likes
  DROP COLUMN IF EXISTS user_wallet;

ALTER TABLE public.nft_likes
  ALTER COLUMN user_id SET NOT NULL;

-- Unique like per user per NFT
CREATE UNIQUE INDEX IF NOT EXISTS nft_likes_unique_user_nft
  ON public.nft_likes (user_id, nft_id);

-- RLS: user-id only
ALTER TABLE public.nft_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "NFT likes: users can like as themselves"
  ON public.nft_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "NFT likes: users can unlike their own likes"
  ON public.nft_likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "NFT likes: users can view their likes"
  ON public.nft_likes
  FOR SELECT
  USING (auth.uid() = user_id);


-- 3) COLLECTION LIKES: remove wallet dependency, go user_id-only

-- Drop existing mixed policies
DROP POLICY IF EXISTS "Authenticated users can like collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Authenticated users can unlike collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Authenticated users can view their own collection likes" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can like collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can only view their own collection likes" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can unlike collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.collection_likes;

-- Drop wallet column and require user_id
ALTER TABLE public.collection_likes
  DROP COLUMN IF EXISTS user_wallet;

ALTER TABLE public.collection_likes
  ALTER COLUMN user_id SET NOT NULL;

-- Unique like per user per collection
CREATE UNIQUE INDEX IF NOT EXISTS collection_likes_unique_user_collection
  ON public.collection_likes (user_id, collection_id);

-- RLS: user-id only
ALTER TABLE public.collection_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection likes: users can like as themselves"
  ON public.collection_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Collection likes: users can unlike their own likes"
  ON public.collection_likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Collection likes: users can view their likes"
  ON public.collection_likes
  FOR SELECT
  USING (auth.uid() = user_id);


-- 4) SUPPORT “LIKES RECEIVED” BY USER-ID ONLY (no wallet mapping):
-- Add creator_user_id to nfts/collections and auto-set to current user on insert if not provided.
-- (We keep these nullable for now; we'll enforce NOT NULL after code changes.)

ALTER TABLE public.nfts
  ADD COLUMN IF NOT EXISTS creator_user_id uuid;

ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS creator_user_id uuid;

CREATE OR REPLACE FUNCTION public.set_creator_user_id_for_nfts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    NEW.creator_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_set_creator_user_id_for_nfts ON public.nfts;
CREATE TRIGGER trg_set_creator_user_id_for_nfts
BEFORE INSERT ON public.nfts
FOR EACH ROW
EXECUTE PROCEDURE public.set_creator_user_id_for_nfts();

CREATE OR REPLACE FUNCTION public.set_creator_user_id_for_collections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    NEW.creator_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_set_creator_user_id_for_collections ON public.collections;
CREATE TRIGGER trg_set_creator_user_id_for_collections
BEFORE INSERT ON public.collections
FOR EACH ROW
EXECUTE PROCEDURE public.set_creator_user_id_for_collections();

-- Optional (to enforce later, after code updates):
-- ALTER TABLE public.nfts ALTER COLUMN creator_user_id SET NOT NULL;
-- ALTER TABLE public.collections ALTER COLUMN creator_user_id SET NOT NULL;
