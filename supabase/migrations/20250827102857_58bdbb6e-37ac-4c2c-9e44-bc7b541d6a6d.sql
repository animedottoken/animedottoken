
-- 1) Fast lookup indexes (no-op if they already exist)
CREATE INDEX IF NOT EXISTS idx_nft_likes_nft_id
  ON public.nft_likes (nft_id);

CREATE INDEX IF NOT EXISTS idx_collection_likes_collection_id
  ON public.collection_likes (collection_id);

-- 2) Public, read-only like counts for NFTs
-- Note: SECURITY DEFINER lets this bypass RLS safely and only returns aggregated counts.
CREATE OR REPLACE FUNCTION public.get_nft_like_counts_public()
RETURNS TABLE (nft_id uuid, like_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT l.nft_id, COUNT(*)::bigint AS like_count
  FROM public.nft_likes l
  GROUP BY l.nft_id;
$function$;

-- 3) Public, read-only like counts for Collections
CREATE OR REPLACE FUNCTION public.get_collection_like_counts_public()
RETURNS TABLE (collection_id uuid, like_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT cl.collection_id, COUNT(*)::bigint AS like_count
  FROM public.collection_likes cl
  GROUP BY cl.collection_id;
$function$;
