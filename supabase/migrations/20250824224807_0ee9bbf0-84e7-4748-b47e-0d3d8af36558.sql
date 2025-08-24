
-- 1) Add FK so PostgREST can embed collections in collection_likes
ALTER TABLE public.collection_likes
  ADD CONSTRAINT collection_likes_collection_id_fkey
  FOREIGN KEY (collection_id) REFERENCES public.collections(id)
  ON DELETE CASCADE;

-- 2) Helpful index for the profile view (fast filtering + ordering)
CREATE INDEX IF NOT EXISTS collection_likes_user_wallet_created_at_idx
  ON public.collection_likes (user_wallet, created_at DESC);
