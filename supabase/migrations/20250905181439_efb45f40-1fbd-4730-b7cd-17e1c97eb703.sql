-- Drop the wallet-based function and create user_id based one
DROP FUNCTION IF EXISTS public.get_creator_like_stats_by_wallet(text);

-- Create RPC to get like stats by creator user_id
CREATE OR REPLACE FUNCTION public.get_creator_like_stats_by_user_id(p_user_id uuid)
RETURNS TABLE(nft_likes_count bigint, collection_likes_count bigint, total_likes_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH nft_likes AS (
    SELECT COUNT(l.id)::bigint AS cnt
    FROM public.nft_likes l
    JOIN public.nfts n ON n.id = l.nft_id
    WHERE n.creator_user_id = p_user_id
  ),
  collection_likes AS (
    SELECT COUNT(*)::bigint AS cnt
    FROM public.collection_likes cl
    JOIN public.collections c ON c.id = cl.collection_id
    WHERE c.creator_user_id = p_user_id
  )
  SELECT 
    COALESCE((SELECT cnt FROM nft_likes), 0)::bigint AS nft_likes_count,
    COALESCE((SELECT cnt FROM collection_likes), 0)::bigint AS collection_likes_count,
    (COALESCE((SELECT cnt FROM nft_likes), 0) + COALESCE((SELECT cnt FROM collection_likes), 0))::bigint AS total_likes_count;
$$;