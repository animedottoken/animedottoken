-- Add privacy control to user_profiles table
-- This allows users to control whether their profile is publicly visible

-- Step 1: Add is_public_profile column (default true for backward compatibility)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.user_profiles.is_public_profile IS 'Controls whether the profile is publicly visible. Set to false to opt out of public listings.';

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_public 
ON public.user_profiles(is_public_profile) 
WHERE is_public_profile = true;

-- Step 4: Create a secure function to get public profile data (only safe fields)
CREATE OR REPLACE FUNCTION public.get_public_profile_safe(p_wallet_address TEXT)
RETURNS TABLE(
  wallet_address TEXT,
  nickname TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  bio TEXT,
  verified BOOLEAN,
  profile_rank TEXT,
  is_public_profile BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.wallet_address,
    up.nickname,
    up.display_name,
    up.profile_image_url,
    up.banner_image_url,
    up.bio,
    up.verified,
    up.profile_rank,
    up.is_public_profile,
    up.created_at
  FROM public.user_profiles up
  WHERE up.wallet_address = p_wallet_address
    AND up.is_public_profile = true;
$$;

-- Step 5: Add RLS policy for public viewing of public profiles (limited fields)
-- This allows authenticated and anonymous users to view profiles that are marked as public
DROP POLICY IF EXISTS "Public can view public profiles" ON public.user_profiles;
CREATE POLICY "Public can view public profiles"
ON public.user_profiles
FOR SELECT
TO public
USING (is_public_profile = true);

-- Step 6: Update existing get_creators_public_explore to respect privacy
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
SET search_path = public
AS $$
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
    WHERE up.nickname IS NOT NULL 
      AND up.nickname != ''
      AND up.is_public_profile = true  -- PRIVACY CHECK ADDED
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
$$;

-- Step 7: Update get_collections_public_explore to respect privacy
CREATE OR REPLACE FUNCTION public.get_collections_public_explore()
RETURNS TABLE(
  id uuid,
  name text,
  symbol text,
  description text,
  site_description text,
  onchain_description text,
  image_url text,
  banner_image_url text,
  creator_address text,
  treasury_wallet text,
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
    c.creator_address, c.treasury_wallet,
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
    AND up.is_public_profile = true;  -- PRIVACY CHECK ADDED
$$;

-- Step 8: Update get_nfts_public_explore to respect privacy
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
SET search_path = public
AS $$
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
    -- Include listed NFTs with proper nicknames AND public profiles
    (n.is_listed = true 
     AND owner_profile.nickname IS NOT NULL 
     AND owner_profile.nickname != ''
     AND owner_profile.is_public_profile = true)
    OR 
    -- Include unlisted NFTs from live collections with proper nicknames AND public profiles
    (c.is_active = true 
     AND c.is_live = true 
     AND creator_profile.nickname IS NOT NULL 
     AND creator_profile.nickname != ''
     AND creator_profile.is_public_profile = true)
  );
$$;

-- Step 9: Add security audit logging for privacy changes
CREATE OR REPLACE FUNCTION public.audit_profile_privacy_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when users change their privacy settings
  IF OLD.is_public_profile IS DISTINCT FROM NEW.is_public_profile THEN
    INSERT INTO public.security_audit_log (
      table_name,
      operation,
      user_wallet,
      old_data,
      new_data
    ) VALUES (
      'user_profiles_privacy_change',
      'UPDATE',
      NEW.wallet_address,
      jsonb_build_object('is_public_profile', OLD.is_public_profile),
      jsonb_build_object('is_public_profile', NEW.is_public_profile)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for privacy changes
DROP TRIGGER IF EXISTS audit_profile_privacy_changes ON public.user_profiles;
CREATE TRIGGER audit_profile_privacy_changes
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_privacy_changes();