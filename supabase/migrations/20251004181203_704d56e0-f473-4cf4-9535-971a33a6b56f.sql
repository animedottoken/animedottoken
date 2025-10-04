-- Security Fix: Remove wallet addresses from public creator exploration
-- This prevents harvesting of wallet addresses for phishing attacks

DROP FUNCTION IF EXISTS public.get_creators_public_explore();

CREATE OR REPLACE FUNCTION public.get_creators_public_explore()
RETURNS TABLE(
  creator_user_id uuid, 
  nickname text, 
  profile_image_url text, 
  verified boolean, 
  profile_rank text, 
  follower_count bigint, 
  nft_likes_count bigint, 
  collection_likes_count bigint, 
  total_likes_count bigint, 
  created_nft_count bigint, 
  created_collection_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH creators AS (
    SELECT DISTINCT n.creator_user_id
    FROM public.nfts n
    WHERE n.creator_user_id IS NOT NULL
    
    UNION
    
    SELECT DISTINCT c.creator_user_id
    FROM public.collections c
    WHERE c.creator_user_id IS NOT NULL
      AND c.is_active = true
      AND c.is_live = true
  ),
  creator_profiles AS (
    SELECT 
      c.creator_user_id,
      up.nickname,
      up.profile_image_url,
      up.verified,
      up.profile_rank
    FROM creators c
    JOIN public.user_profiles up ON up.user_id = c.creator_user_id
    WHERE up.nickname IS NOT NULL AND up.nickname != ''
  ),
  creator_stats AS (
    SELECT * FROM public.get_creators_public_stats()
  ),
  nft_counts AS (
    SELECT 
      n.creator_user_id,
      COUNT(*)::bigint AS created_nft_count
    FROM public.nfts n
    WHERE n.creator_user_id IS NOT NULL
    GROUP BY n.creator_user_id
  ),
  collection_counts AS (
    SELECT 
      c.creator_user_id,
      COUNT(*)::bigint AS created_collection_count
    FROM public.collections c
    WHERE c.creator_user_id IS NOT NULL
      AND c.is_active = true
      AND c.is_live = true
    GROUP BY c.creator_user_id
  )
  SELECT 
    cp.creator_user_id,
    cp.nickname,
    cp.profile_image_url,
    cp.verified,
    cp.profile_rank,
    COALESCE(cs.follower_count, 0::bigint) AS follower_count,
    COALESCE(cs.nft_likes_count, 0::bigint) AS nft_likes_count,
    COALESCE(cs.collection_likes_count, 0::bigint) AS collection_likes_count,
    COALESCE(cs.total_likes_count, 0::bigint) AS total_likes_count,
    COALESCE(nc.created_nft_count, 0::bigint) AS created_nft_count,
    COALESCE(cc.created_collection_count, 0::bigint) AS created_collection_count
  FROM creator_profiles cp
  LEFT JOIN creator_stats cs ON cs.creator_user_id = cp.creator_user_id
  LEFT JOIN nft_counts nc ON nc.creator_user_id = cp.creator_user_id
  LEFT JOIN collection_counts cc ON cc.creator_user_id = cp.creator_user_id
  ORDER BY cs.total_likes_count DESC NULLS LAST, cp.nickname;
$function$;