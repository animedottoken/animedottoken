-- Drop existing functions and recreate with correct return types

DROP FUNCTION IF EXISTS public.get_creator_follow_stats();
DROP FUNCTION IF EXISTS public.get_creator_collection_like_stats();
DROP FUNCTION IF EXISTS public.get_creator_nft_like_stats();
DROP FUNCTION IF EXISTS public.get_creators_public_stats();

-- 1) Followers per creator (by user_id)
CREATE OR REPLACE FUNCTION public.get_creator_follow_stats()
RETURNS TABLE(creator_user_id uuid, follower_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    cf.creator_user_id,
    COUNT(*)::bigint AS follower_count
  FROM public.creator_follows cf
  GROUP BY cf.creator_user_id;
$function$;

-- 2) Collection likes per creator (by user_id)
CREATE OR REPLACE FUNCTION public.get_creator_collection_like_stats()
RETURNS TABLE(creator_user_id uuid, collection_likes_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    c.creator_user_id,
    COUNT(*)::bigint AS collection_likes_count
  FROM public.collection_likes cl
  JOIN public.collections c ON c.id = cl.collection_id
  WHERE c.creator_user_id IS NOT NULL
  GROUP BY c.creator_user_id;
$function$;

-- 3) NFT likes per creator (by user_id)
CREATE OR REPLACE FUNCTION public.get_creator_nft_like_stats()
RETURNS TABLE(creator_user_id uuid, nft_likes_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    n.creator_user_id,
    COUNT(l.id)::bigint AS nft_likes_count
  FROM public.nft_likes l
  JOIN public.nfts n ON n.id = l.nft_id
  WHERE n.creator_user_id IS NOT NULL
  GROUP BY n.creator_user_id;
$function$;

-- 4) Combined public creator stats keyed by user_id
CREATE OR REPLACE FUNCTION public.get_creators_public_stats()
RETURNS TABLE(
  creator_user_id uuid,
  follower_count bigint,
  nft_likes_count bigint,
  collection_likes_count bigint,
  total_likes_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH follow_stats AS (
    SELECT creator_user_id, COUNT(*)::bigint AS follower_count
    FROM public.creator_follows
    GROUP BY creator_user_id
  ),
  nft_like_stats AS (
    SELECT n.creator_user_id, COUNT(l.id)::bigint AS nft_likes_count
    FROM public.nft_likes l
    JOIN public.nfts n ON n.id = l.nft_id
    WHERE n.creator_user_id IS NOT NULL
    GROUP BY n.creator_user_id
  ),
  collection_like_stats AS (
    SELECT c.creator_user_id, COUNT(*)::bigint AS collection_likes_count
    FROM public.collection_likes cl
    JOIN public.collections c ON c.id = cl.collection_id
    WHERE c.creator_user_id IS NOT NULL
    GROUP BY c.creator_user_id
  )
  SELECT 
    COALESCE(fs.creator_user_id, nls.creator_user_id, cls.creator_user_id) AS creator_user_id,
    COALESCE(fs.follower_count, 0::bigint) AS follower_count,
    COALESCE(nls.nft_likes_count, 0::bigint) AS nft_likes_count,
    COALESCE(cls.collection_likes_count, 0::bigint) AS collection_likes_count,
    (COALESCE(nls.nft_likes_count, 0::bigint) + COALESCE(cls.collection_likes_count, 0::bigint)) AS total_likes_count
  FROM follow_stats fs
  FULL JOIN nft_like_stats nls ON fs.creator_user_id = nls.creator_user_id
  FULL JOIN collection_like_stats cls ON COALESCE(fs.creator_user_id, nls.creator_user_id) = cls.creator_user_id;
$function$;