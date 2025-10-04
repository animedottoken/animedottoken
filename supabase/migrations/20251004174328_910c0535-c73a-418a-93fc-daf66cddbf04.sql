-- SECURITY HARDENING: Restrict public profile data exposure (Part 2)
-- This migration properly drops and recreates functions with new signatures

-- Step 1: Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view public profiles" ON public.user_profiles;

-- Step 2: Add restricted authenticated-only policy for viewing profiles
CREATE POLICY "Authenticated users can view limited public profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) 
  OR 
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text))
  OR
  (is_public_profile = true)
);

-- Step 3: Drop existing functions that will change signatures
DROP FUNCTION IF EXISTS public.get_public_profile_safe(TEXT);
DROP FUNCTION IF EXISTS public.get_creators_public_explore();
DROP FUNCTION IF EXISTS public.get_collections_public_explore();
DROP FUNCTION IF EXISTS public.get_nfts_public_explore();

-- Step 4: Create limited public profile function (no sensitive data)
CREATE FUNCTION public.get_public_profile_limited(p_wallet_address TEXT)
RETURNS TABLE(
  nickname TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  bio TEXT,
  verified BOOLEAN,
  profile_rank TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.nickname,
    up.display_name,
    up.profile_image_url,
    up.bio,
    up.verified,
    up.profile_rank
  FROM public.user_profiles up
  WHERE up.wallet_address = p_wallet_address
    AND up.is_public_profile = true;
$$;

-- Step 5: Recreate get_creators_public_explore WITHOUT wallet addresses
CREATE FUNCTION public.get_creators_public_explore()
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
SET search_path = public
AS $$
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
    WHERE up.nickname IS NOT NULL 
      AND up.nickname != ''
      AND up.is_public_profile = true
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
$$;

-- Step 6: Recreate get_collections_public_explore WITHOUT creator wallet addresses
CREATE FUNCTION public.get_collections_public_explore()
RETURNS TABLE(
  id uuid,
  name text,
  symbol text,
  description text,
  site_description text,
  onchain_description text,
  image_url text,
  banner_image_url text,
  creator_nickname text,
  creator_verified boolean,
  slug text,
  collection_mint_address text,
  category text,
  mint_price numeric,
  max_supply integer,
  items_available integer,
  items_redeemed integer,
  is_active boolean,
  is_live boolean,
  whitelist_enabled boolean,
  go_live_date timestamp with time zone,
  royalty_percentage numeric,
  external_links jsonb,
  verified boolean,
  explicit_content boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.symbol, c.description, c.site_description,
    c.onchain_description, c.image_url, c.banner_image_url,
    up.nickname as creator_nickname,
    up.verified as creator_verified,
    c.slug, c.collection_mint_address, c.category, c.mint_price,
    c.max_supply, c.items_available, c.items_redeemed, c.is_active,
    c.is_live, c.whitelist_enabled, c.go_live_date, c.royalty_percentage,
    c.external_links, c.verified, c.explicit_content, c.created_at, c.updated_at
  FROM public.collections c
  LEFT JOIN public.user_profiles up ON up.wallet_address = c.creator_address
  WHERE c.is_active = true 
    AND c.is_live = true
    AND up.nickname IS NOT NULL 
    AND up.nickname != ''
    AND up.is_public_profile = true;
$$;

-- Step 7: Recreate get_nfts_public_explore WITHOUT owner/creator wallet addresses
CREATE FUNCTION public.get_nfts_public_explore()
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
SET search_path = public
AS $$
  SELECT 
    n.id, n.collection_id, n.mint_address, n.name, n.symbol,
    n.description, n.image_url, n.metadata_uri, n.attributes,
    n.is_listed, n.price, n.currency, n.is_featured,
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
    (n.is_listed = true 
     AND owner_profile.nickname IS NOT NULL 
     AND owner_profile.nickname != ''
     AND owner_profile.is_public_profile = true)
    OR 
    (c.is_active = true 
     AND c.is_live = true 
     AND creator_profile.nickname IS NOT NULL 
     AND creator_profile.nickname != ''
     AND creator_profile.is_public_profile = true)
  );
$$;

-- Step 8: Create authenticated function for full profile details
CREATE FUNCTION public.get_profile_authenticated(p_user_id UUID)
RETURNS TABLE(
  user_id uuid,
  wallet_address TEXT,
  nickname TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  bio TEXT,
  verified BOOLEAN,
  profile_rank TEXT,
  twitter_handle TEXT,
  discord_handle TEXT,
  website_url TEXT,
  nft_count INTEGER,
  collection_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.user_id,
    CASE 
      WHEN up.user_id = auth.uid() THEN up.wallet_address
      ELSE concat(left(up.wallet_address, 4), '...', right(up.wallet_address, 4))
    END as wallet_address,
    up.nickname,
    up.display_name,
    up.profile_image_url,
    up.banner_image_url,
    up.bio,
    up.verified,
    up.profile_rank,
    CASE 
      WHEN up.is_public_profile = true THEN up.twitter_handle
      ELSE NULL
    END as twitter_handle,
    CASE 
      WHEN up.is_public_profile = true THEN up.discord_handle
      ELSE NULL
    END as discord_handle,
    CASE 
      WHEN up.is_public_profile = true THEN up.website_url
      ELSE NULL
    END as website_url,
    up.nft_count,
    up.collection_count,
    up.created_at
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id
    AND (
      up.is_public_profile = true 
      OR up.user_id = auth.uid()
    );
$$;

-- Step 9: Create limited public profile view
CREATE OR REPLACE VIEW public.public_profiles_limited AS
SELECT 
  user_id,
  nickname,
  display_name,
  profile_image_url,
  verified,
  profile_rank,
  created_at
FROM public.user_profiles
WHERE is_public_profile = true
  AND nickname IS NOT NULL
  AND nickname != '';

GRANT SELECT ON public.public_profiles_limited TO anon, authenticated;