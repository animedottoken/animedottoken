-- Extend creators_public_stats view to include collection likes and total likes
DROP VIEW IF EXISTS public.creators_public_stats;

CREATE VIEW public.creators_public_stats AS
SELECT 
  COALESCE(fs.creator_wallet, nls.creator_wallet, cls.creator_wallet) as wallet_address,
  COALESCE(fs.follower_count, 0) as follower_count,
  COALESCE(nls.nft_likes_count, 0) as nft_likes_count,
  COALESCE(cls.collection_likes_count, 0) as collection_likes_count,
  (COALESCE(nls.nft_likes_count, 0) + COALESCE(cls.collection_likes_count, 0)) as total_likes_count
FROM creator_follow_stats fs
FULL OUTER JOIN creator_nft_like_stats nls ON fs.creator_wallet = nls.creator_wallet
FULL OUTER JOIN creator_collection_like_stats cls ON COALESCE(fs.creator_wallet, nls.creator_wallet) = cls.creator_wallet;

-- Ensure realtime is enabled for collection_likes table
ALTER TABLE public.collection_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_likes;