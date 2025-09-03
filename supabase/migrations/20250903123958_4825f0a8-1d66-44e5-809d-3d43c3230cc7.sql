-- Clean migration: Remove ALL existing policies first, then recreate everything

-- 1. Drop ALL existing policies on all relevant tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- Drop all policies on creator_follows
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'creator_follows' AND schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
    
    -- Drop all policies on nft_likes
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'nft_likes' AND schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
    
    -- Drop all policies on collection_likes
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'collection_likes' AND schemaname = 'public') 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. Drop and recreate creator_follows table with proper user-ID structure
DROP TABLE IF EXISTS public.creator_follows CASCADE;

CREATE TABLE public.creator_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_user_id, creator_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_creator_follows_follower ON public.creator_follows(follower_user_id);
CREATE INDEX idx_creator_follows_creator ON public.creator_follows(creator_user_id);

-- Enable RLS and create policies
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow others" ON public.creator_follows
FOR INSERT TO authenticated
WITH CHECK (follower_user_id = auth.uid());

CREATE POLICY "Users can unfollow others" ON public.creator_follows
FOR DELETE TO authenticated
USING (follower_user_id = auth.uid());

CREATE POLICY "Users can view their follows and followers" ON public.creator_follows
FOR SELECT TO authenticated
USING (follower_user_id = auth.uid() OR creator_user_id = auth.uid());

-- 3. Fix nft_likes table - remove wallet columns and set proper constraints
ALTER TABLE public.nft_likes DROP COLUMN IF EXISTS user_wallet;
ALTER TABLE public.nft_likes ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint and index
DROP INDEX IF EXISTS idx_nft_likes_user_nft;
DROP INDEX IF EXISTS idx_nft_likes_user;
ALTER TABLE public.nft_likes DROP CONSTRAINT IF EXISTS unique_nft_like_per_user;
ALTER TABLE public.nft_likes ADD CONSTRAINT unique_nft_like_per_user UNIQUE(user_id, nft_id);
CREATE INDEX idx_nft_likes_user ON public.nft_likes(user_id);

-- Create new RLS policies for nft_likes
CREATE POLICY "Users can like NFTs" ON public.nft_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike NFTs" ON public.nft_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their NFT likes" ON public.nft_likes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 4. Fix collection_likes table - remove wallet columns and set proper constraints
ALTER TABLE public.collection_likes DROP COLUMN IF EXISTS user_wallet;
ALTER TABLE public.collection_likes ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint and index
DROP INDEX IF EXISTS idx_collection_likes_user_collection;
DROP INDEX IF EXISTS idx_collection_likes_user;
ALTER TABLE public.collection_likes DROP CONSTRAINT IF EXISTS unique_collection_like_per_user;
ALTER TABLE public.collection_likes ADD CONSTRAINT unique_collection_like_per_user UNIQUE(user_id, collection_id);
CREATE INDEX idx_collection_likes_user ON public.collection_likes(user_id);

-- Create new RLS policies for collection_likes
CREATE POLICY "Users can like collections" ON public.collection_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike collections" ON public.collection_likes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view their collection likes" ON public.collection_likes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. Add creator_user_id to nfts and collections for user-based like counting
ALTER TABLE public.nfts ADD COLUMN IF NOT EXISTS creator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS creator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nfts_creator_user ON public.nfts(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_collections_creator_user ON public.collections(creator_user_id);

-- Create trigger function to auto-set creator_user_id on insert
CREATE OR REPLACE FUNCTION public.set_creator_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_user_id IS NULL THEN
    NEW.creator_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for auto-setting creator_user_id
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