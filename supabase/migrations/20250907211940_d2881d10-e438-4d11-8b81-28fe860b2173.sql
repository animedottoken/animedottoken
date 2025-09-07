-- Update get_creators_public_explore to return wallet_address for proper routing
DROP FUNCTION IF EXISTS public.get_creators_public_explore();

CREATE OR REPLACE FUNCTION public.get_creators_public_explore()
RETURNS TABLE(
  creator_user_id uuid, 
  wallet_address text,
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
    -- Get creators from NFTs
    SELECT DISTINCT n.creator_user_id
    FROM public.nfts n
    WHERE n.creator_user_id IS NOT NULL
    
    UNION
    
    -- Get creators from live collections
    SELECT DISTINCT c.creator_user_id
    FROM public.collections c
    WHERE c.creator_user_id IS NOT NULL
      AND c.is_active = true
      AND c.is_live = true
  ),
  creator_profiles AS (
    SELECT 
      c.creator_user_id,
      up.wallet_address,
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
    cp.wallet_address,
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

-- Update get_nfts_public_explore to include unlisted NFTs from live collections
DROP FUNCTION IF EXISTS public.get_nfts_public_explore();

CREATE OR REPLACE FUNCTION public.get_nfts_public_explore()
RETURNS TABLE(
  id uuid, 
  collection_id uuid, 
  mint_address text, 
  name text, 
  symbol text, 
  description text, 
  image_url text, 
  metadata_uri text, 
  attributes jsonb, 
  is_listed boolean, 
  price numeric, 
  currency text, 
  is_featured boolean, 
  owner_address text, 
  creator_address text, 
  owner_nickname text, 
  owner_verified boolean, 
  creator_nickname text, 
  creator_verified boolean, 
  views integer, 
  featured_at timestamp with time zone, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    n.id, n.collection_id, n.mint_address, n.name, n.symbol,
    n.description, n.image_url, n.metadata_uri, n.attributes,
    n.is_listed, n.price, n.currency, n.is_featured,
    n.owner_address, n.creator_address,
    owner_profile.nickname as owner_nickname,
    owner_profile.verified as owner_verified,
    creator_profile.nickname as creator_nickname,
    creator_profile.verified as creator_verified,
    n.views, n.featured_at, n.created_at, n.updated_at
  FROM public.nfts n
  LEFT JOIN public.user_profiles owner_profile ON owner_profile.wallet_address = n.owner_address
  LEFT JOIN public.user_profiles creator_profile ON creator_profile.wallet_address = n.creator_address
  LEFT JOIN public.collections c ON c.id = n.collection_id
  WHERE (
    -- Include listed NFTs with proper nicknames
    (n.is_listed = true AND owner_profile.nickname IS NOT NULL AND owner_profile.nickname != '')
    OR 
    -- Include unlisted NFTs from live collections with proper nicknames
    (c.is_active = true AND c.is_live = true AND creator_profile.nickname IS NOT NULL AND creator_profile.nickname != '')
  );
$function$;