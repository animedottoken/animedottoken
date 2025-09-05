-- Create RPC to get like stats by creator wallet
CREATE OR REPLACE FUNCTION public.get_creator_like_stats_by_wallet(p_wallet text)
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
    WHERE n.creator_address = p_wallet
  ),
  collection_likes AS (
    SELECT COUNT(*)::bigint AS cnt
    FROM public.collection_likes cl
    JOIN public.collections c ON c.id = cl.collection_id
    WHERE c.creator_address = p_wallet
  )
  SELECT 
    COALESCE((SELECT cnt FROM nft_likes), 0)::bigint AS nft_likes_count,
    COALESCE((SELECT cnt FROM collection_likes), 0)::bigint AS collection_likes_count,
    (COALESCE((SELECT cnt FROM nft_likes), 0) + COALESCE((SELECT cnt FROM collection_likes), 0))::bigint AS total_likes_count;
$$;