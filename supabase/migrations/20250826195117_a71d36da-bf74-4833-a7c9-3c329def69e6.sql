-- Fix Function Search Path Mutable warnings by setting explicit search_path
-- This prevents potential schema injection attacks

-- Update all functions to use explicit search_path
CREATE OR REPLACE FUNCTION public.get_collection_like_counts()
RETURNS TABLE(collection_id uuid, like_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    cl.collection_id,
    count(*) AS like_count
  FROM public.collection_likes cl
  GROUP BY cl.collection_id;
$$;

CREATE OR REPLACE FUNCTION public.get_collections_public() 
RETURNS TABLE(
  id uuid, name text, symbol text, description text, site_description text,
  onchain_description text, image_url text, banner_image_url text,
  creator_address text, treasury_wallet text, slug text, collection_mint_address text,
  category text, candy_machine_id text, mint_price numeric, max_supply integer,
  items_available integer, items_redeemed integer, is_active boolean, is_live boolean,
  whitelist_enabled boolean, go_live_date timestamptz, royalty_percentage numeric,
  external_links jsonb, verified boolean, explicit_content boolean, 
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.symbol, c.description, c.site_description,
    c.onchain_description, c.image_url, c.banner_image_url,
    concat(left(c.creator_address, 4), '...', right(c.creator_address, 4)) AS creator_address,
    concat(left(c.treasury_wallet, 4), '...', right(c.treasury_wallet, 4)) AS treasury_wallet,
    c.slug, c.collection_mint_address, c.category, c.candy_machine_id,
    c.mint_price, c.max_supply, c.items_available, c.items_redeemed,
    c.is_active, c.is_live, c.whitelist_enabled, c.go_live_date,
    c.royalty_percentage, c.external_links, c.verified, c.explicit_content,
    c.created_at, c.updated_at
  FROM public.collections c
  WHERE c.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_follow_stats()
RETURNS TABLE(creator_wallet text, follower_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    cf.creator_wallet,
    count(*) AS follower_count
  FROM public.creator_follows cf
  GROUP BY cf.creator_wallet;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_collection_like_stats()
RETURNS TABLE(creator_wallet text, collection_likes_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    c.creator_address AS creator_wallet,
    count(*) AS collection_likes_count
  FROM public.collection_likes cl
  JOIN public.collections c ON c.id = cl.collection_id
  GROUP BY c.creator_address;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_nft_like_stats()
RETURNS TABLE(creator_wallet text, nft_likes_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    n.creator_address AS creator_wallet,
    count(l.id) AS nft_likes_count
  FROM public.nft_likes l
  JOIN public.nfts n ON n.id = l.nft_id
  GROUP BY n.creator_address;
$$;

CREATE OR REPLACE FUNCTION public.get_boosted_leaderboard()
RETURNS TABLE(
  id uuid, nft_id uuid, bid_amount numeric, token_mint text, bidder_wallet text,
  tx_signature text, start_time timestamptz, end_time timestamptz, is_active boolean,
  nft_name text, nft_image_url text, owner_address text, bid_rank bigint, tier text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    bl.id, bl.nft_id, bl.bid_amount, bl.token_mint, bl.bidder_wallet,
    bl.tx_signature, bl.start_time, bl.end_time, bl.is_active,
    n.name AS nft_name, n.image_url AS nft_image_url, n.owner_address,
    rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) AS bid_rank,
    CASE
      WHEN rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) BETWEEN 1 AND 3 THEN 'god'::text
      WHEN rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) BETWEEN 4 AND 10 THEN 'top'::text
      ELSE 'boosted'::text
    END AS tier
  FROM public.boosted_listings bl
  JOIN public.nfts n ON n.id = bl.nft_id
  WHERE bl.is_active = true AND now() < bl.end_time;
$$;

CREATE OR REPLACE FUNCTION public.get_creators_public_stats()
RETURNS TABLE(
  wallet_address text, follower_count bigint, nft_likes_count bigint,
  collection_likes_count bigint, total_likes_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH follow_stats AS (
    SELECT creator_wallet, count(*) as follower_count
    FROM public.creator_follows GROUP BY creator_wallet
  ),
  nft_like_stats AS (
    SELECT n.creator_address as creator_wallet, count(l.id) as nft_likes_count
    FROM public.nft_likes l
    JOIN public.nfts n ON n.id = l.nft_id
    GROUP BY n.creator_address
  ),
  collection_like_stats AS (
    SELECT c.creator_address as creator_wallet, count(*) as collection_likes_count
    FROM public.collection_likes cl
    JOIN public.collections c ON c.id = cl.collection_id
    GROUP BY c.creator_address
  )
  SELECT 
    COALESCE(fs.creator_wallet, nls.creator_wallet, cls.creator_wallet) AS wallet_address,
    COALESCE(fs.follower_count, 0::bigint) AS follower_count,
    COALESCE(nls.nft_likes_count, 0::bigint) AS nft_likes_count,
    COALESCE(cls.collection_likes_count, 0::bigint) AS collection_likes_count,
    (COALESCE(nls.nft_likes_count, 0::bigint) + COALESCE(cls.collection_likes_count, 0::bigint)) AS total_likes_count
  FROM follow_stats fs
  FULL JOIN nft_like_stats nls ON fs.creator_wallet = nls.creator_wallet
  FULL JOIN collection_like_stats cls ON COALESCE(fs.creator_wallet, nls.creator_wallet) = cls.creator_wallet;
$$;