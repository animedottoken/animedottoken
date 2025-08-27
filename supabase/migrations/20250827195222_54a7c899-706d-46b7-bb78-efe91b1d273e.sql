-- Phase 1: Add user_id columns and RLS policies for Web2.5 auth

-- Add user_id column to nft_likes (nullable for backward compatibility)
ALTER TABLE public.nft_likes 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to collection_likes (nullable for backward compatibility)
ALTER TABLE public.collection_likes 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to creator_follows (nullable for backward compatibility)
ALTER TABLE public.creator_follows 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add partial unique indexes to prevent duplicate likes/follows per user
CREATE UNIQUE INDEX idx_nft_likes_user_id_nft_id 
ON public.nft_likes (user_id, nft_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_collection_likes_user_id_collection_id 
ON public.collection_likes (user_id, collection_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_creator_follows_user_id_creator 
ON public.creator_follows (user_id, creator_wallet) 
WHERE user_id IS NOT NULL;

-- Add new RLS policies for JWT-based authentication

-- NFT Likes policies for authenticated users
CREATE POLICY "Authenticated users can like NFTs" 
ON public.nft_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own NFT likes" 
ON public.nft_likes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can unlike NFTs" 
ON public.nft_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Collection Likes policies for authenticated users
CREATE POLICY "Authenticated users can like collections" 
ON public.collection_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own collection likes" 
ON public.collection_likes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can unlike collections" 
ON public.collection_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Creator Follows policies for authenticated users
CREATE POLICY "Authenticated users can follow creators" 
ON public.creator_follows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own follows" 
ON public.creator_follows 
FOR SELECT 
USING (auth.uid() = user_id OR creator_wallet = (
  SELECT wallet_address FROM public.user_profiles WHERE id = auth.uid()
));

CREATE POLICY "Authenticated users can unfollow creators" 
ON public.creator_follows 
FOR DELETE 
USING (auth.uid() = user_id);