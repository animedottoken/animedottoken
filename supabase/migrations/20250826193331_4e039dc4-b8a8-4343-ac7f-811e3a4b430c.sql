-- Fix Security Definer Views by recreating them with proper ownership
-- Drop existing views (in reverse dependency order)
DROP VIEW IF EXISTS public.creators_public_stats;
DROP VIEW IF EXISTS public.creator_nft_likes_stats;
DROP VIEW IF EXISTS public.creator_nft_like_stats;  
DROP VIEW IF EXISTS public.creator_collection_like_stats;
DROP VIEW IF EXISTS public.creator_follow_stats;
DROP VIEW IF EXISTS public.collections_public;
DROP VIEW IF EXISTS public.collection_like_counts;
DROP VIEW IF EXISTS public.boosted_leaderboard;

-- Recreate views (they will now be owned by authenticator instead of postgres)
-- Collection like counts view
CREATE VIEW public.collection_like_counts AS 
SELECT 
    collection_id,
    count(*) AS like_count
FROM public.collection_likes cl
GROUP BY collection_id;

-- Collections public view (with masked addresses for privacy)
CREATE VIEW public.collections_public AS 
SELECT 
    id,
    name,
    symbol,
    description,
    site_description,
    onchain_description,
    image_url,
    banner_image_url,
    concat(left(creator_address, 4), '...', right(creator_address, 4)) AS creator_address,
    concat(left(treasury_wallet, 4), '...', right(treasury_wallet, 4)) AS treasury_wallet,
    slug,
    collection_mint_address,
    category,
    candy_machine_id,
    mint_price,
    max_supply,
    items_available,
    items_redeemed,
    is_active,
    is_live,
    whitelist_enabled,
    go_live_date,
    royalty_percentage,
    external_links,
    verified,
    explicit_content,
    created_at,
    updated_at
FROM public.collections
WHERE is_active = true;

-- Creator follow stats view
CREATE VIEW public.creator_follow_stats AS 
SELECT 
    creator_wallet,
    count(*) AS follower_count
FROM public.creator_follows cf
GROUP BY creator_wallet;

-- Creator collection like stats view
CREATE VIEW public.creator_collection_like_stats AS 
SELECT 
    c.creator_address AS creator_wallet,
    count(*) AS collection_likes_count
FROM public.collection_likes cl
JOIN public.collections c ON c.id = cl.collection_id
GROUP BY c.creator_address;

-- Creator NFT like stats view
CREATE VIEW public.creator_nft_like_stats AS 
SELECT 
    n.creator_address AS creator_wallet,
    count(l.id) AS nft_likes_count
FROM public.nft_likes l
JOIN public.nfts n ON n.id = l.nft_id
GROUP BY n.creator_address;

-- Creator NFT likes stats view (with LEFT JOIN)
CREATE VIEW public.creator_nft_likes_stats AS 
SELECT 
    n.creator_address AS creator_wallet,
    count(nl.id) AS nft_likes_count
FROM public.nfts n
LEFT JOIN public.nft_likes nl ON n.id = nl.nft_id
GROUP BY n.creator_address;

-- Comprehensive creator public stats view
CREATE VIEW public.creators_public_stats AS 
SELECT 
    COALESCE(fs.creator_wallet, nls.creator_wallet, cls.creator_wallet) AS wallet_address,
    COALESCE(fs.follower_count, 0::bigint) AS follower_count,
    COALESCE(nls.nft_likes_count, 0::bigint) AS nft_likes_count,
    COALESCE(cls.collection_likes_count, 0::bigint) AS collection_likes_count,
    (COALESCE(nls.nft_likes_count, 0::bigint) + COALESCE(cls.collection_likes_count, 0::bigint)) AS total_likes_count
FROM public.creator_follow_stats fs
FULL JOIN public.creator_nft_like_stats nls ON fs.creator_wallet = nls.creator_wallet
FULL JOIN public.creator_collection_like_stats cls ON COALESCE(fs.creator_wallet, nls.creator_wallet) = cls.creator_wallet;

-- Boosted leaderboard view
CREATE VIEW public.boosted_leaderboard AS 
SELECT 
    bl.id,
    bl.nft_id,
    bl.bid_amount,
    bl.token_mint,
    bl.bidder_wallet,
    bl.tx_signature,
    bl.start_time,
    bl.end_time,
    bl.is_active,
    n.name AS nft_name,
    n.image_url AS nft_image_url,
    n.owner_address,
    rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) AS bid_rank,
    CASE
        WHEN rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) BETWEEN 1 AND 3 THEN 'god'::text
        WHEN rank() OVER (ORDER BY bl.bid_amount DESC, bl.start_time) BETWEEN 4 AND 10 THEN 'top'::text
        ELSE 'boosted'::text
    END AS tier
FROM public.boosted_listings bl
JOIN public.nfts n ON n.id = bl.nft_id
WHERE bl.is_active = true AND now() < bl.end_time;

-- Ensure proper permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.creators_public_stats IS 'Aggregated public statistics for creators including follower counts and like counts';
COMMENT ON VIEW public.collections_public IS 'Public view of active collections with masked creator addresses for privacy';
COMMENT ON VIEW public.boosted_leaderboard IS 'Real-time leaderboard of active boosted NFT listings with rankings';