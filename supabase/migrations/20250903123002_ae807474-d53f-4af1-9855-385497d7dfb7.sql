-- Complete database migration to remove wallet dependency from follows and likes

-- 1. Recreate creator_follows with proper user-ID structure
DROP TABLE IF EXISTS public.creator_follows CASCADE;

CREATE TABLE public.creator_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_user_id, creator_user_id),
  CHECK (follower_user_id != creator_user_id) -- Prevent self-following
);

-- Create indexes for performance
CREATE INDEX idx_creator_follows_follower ON public.creator_follows(follower_user_id);
CREATE INDEX idx_creator_follows_creator ON public.creator_follows(creator_user_id);

-- Enable RLS
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_follows
CREATE POLICY "Users can follow others" ON public.creator_follows
FOR INSERT TO authenticated
WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY "Users can unfollow others" ON public.creator_follows
FOR DELETE TO authenticated
USING (follower_user_id = auth.uid());

CREATE POLICY "Users can view their follows and followers" ON public.creator_follows
FOR SELECT TO authenticated
USING (follower_user_id = auth.uid() OR creator_user_id = auth.uid());

-- 2. Fix nft_likes table - remove wallet dependency
ALTER TABLE public.nft_likes DROP COLUMN IF EXISTS user_wallet;
ALTER TABLE public.nft_likes ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint and index
DROP INDEX IF EXISTS idx_nft_likes_user_nft;
ALTER TABLE public.nft_likes DROP CONSTRAINT IF EXISTS unique_nft_like_per_user;
ALTER TABLE public.nft_likes ADD CONSTRAINT unique_nft_like_per_user UNIQUE(user_id, nft_id);
CREATE INDEX idx_nft_likes_user ON public.nft_likes(user_id);

-- Update RLS policies for nft_likes
DROP POLICY IF EXISTS "Users can like nfts" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can unlike nfts" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can only view their own NFT likes" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can view their own NFT likes" ON public.nft_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.nft_likes;

CREATE POLICY "Authenticated users can like NFTs" ON public.nft_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can unlike NFTs" ON public.nft_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own NFT likes" ON public.nft_likes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. Fix collection_likes table - remove wallet dependency
ALTER TABLE public.collection_likes DROP COLUMN IF EXISTS user_wallet;
ALTER TABLE public.collection_likes ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint and index
DROP INDEX IF EXISTS idx_collection_likes_user_collection;
ALTER TABLE public.collection_likes DROP CONSTRAINT IF EXISTS unique_collection_like_per_user;
ALTER TABLE public.collection_likes ADD CONSTRAINT unique_collection_like_per_user UNIQUE(user_id, collection_id);
CREATE INDEX idx_collection_likes_user ON public.collection_likes(user_id);

-- Update RLS policies for collection_likes
DROP POLICY IF EXISTS "Users can like collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can unlike collections" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can only view their own collection likes" ON public.collection_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.collection_likes;

CREATE POLICY "Authenticated users can like collections" ON public.collection_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can unlike collections" ON public.collection_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own collection likes" ON public.collection_likes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. Add creator_user_id to nfts and collections for like counting
ALTER TABLE public.nfts ADD COLUMN IF NOT EXISTS creator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS creator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nfts_creator_user ON public.nfts(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_creator_user ON public.collections(creator_user_id);

-- Create trigger to auto-set creator_user_id on insert
CREATE OR REPLACE FUNCTION public.set_creator_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    NEW.creator_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers
DROP TRIGGER IF EXISTS set_nft_creator_user_id ON public.nfts;
CREATE TRIGGER set_nft_creator_user_id
  BEFORE INSERT ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_creator_user_id();

DROP TRIGGER IF EXISTS set_collection_creator_user_id ON public.collections;
CREATE TRIGGER set_collection_creator_user_id
  BEFORE INSERT ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_creator_user_id();