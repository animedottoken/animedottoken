-- Step 1: Delete all existing likes to start fresh
DELETE FROM public.nft_likes;
DELETE FROM public.collection_likes;

-- Step 2: Add unique constraints to prevent duplicate likes/follows
-- For NFT likes: one like per user per NFT
ALTER TABLE public.nft_likes 
ADD CONSTRAINT unique_nft_user_like UNIQUE (nft_id, user_wallet);

-- For collection likes: one like per user per collection
ALTER TABLE public.collection_likes 
ADD CONSTRAINT unique_collection_user_like UNIQUE (collection_id, user_wallet);

-- For creator follows: one follow per follower per creator
ALTER TABLE public.creator_follows 
ADD CONSTRAINT unique_creator_follower UNIQUE (creator_wallet, follower_wallet);

-- Step 3: Add indexes for fast counting
CREATE INDEX IF NOT EXISTS idx_nft_likes_nft_id ON public.nft_likes(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_likes_user_wallet ON public.nft_likes(user_wallet);
CREATE INDEX IF NOT EXISTS idx_collection_likes_collection_id ON public.collection_likes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_likes_user_wallet ON public.collection_likes(user_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_follows_creator_wallet ON public.creator_follows(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_follows_follower_wallet ON public.creator_follows(follower_wallet);