-- Add triggers to enforce nickname requirement for listings
CREATE OR REPLACE FUNCTION public.check_nickname_before_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_nickname TEXT;
BEGIN
  -- For NFTs: check if setting is_listed = true
  IF TG_TABLE_NAME = 'nfts' AND NEW.is_listed = true AND (OLD.is_listed IS NULL OR OLD.is_listed = false) THEN
    SELECT nickname INTO user_nickname
    FROM public.user_profiles
    WHERE wallet_address = NEW.owner_address;
    
    IF user_nickname IS NULL OR user_nickname = '' THEN
      RAISE EXCEPTION 'You must set a nickname in your profile before listing NFTs on the marketplace';
    END IF;
  END IF;
  
  -- For Collections: check if setting is_active AND is_live = true
  IF TG_TABLE_NAME = 'collections' AND NEW.is_active = true AND NEW.is_live = true THEN
    -- Check if this is a new activation (wasn't both active and live before)
    IF (OLD.is_active IS NULL OR OLD.is_active = false OR OLD.is_live IS NULL OR OLD.is_live = false) THEN
      SELECT nickname INTO user_nickname
      FROM public.user_profiles
      WHERE wallet_address = NEW.creator_address;
      
      IF user_nickname IS NULL OR user_nickname = '' THEN
        RAISE EXCEPTION 'You must set a nickname in your profile before making collections live on the marketplace';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER nft_nickname_check
  BEFORE UPDATE ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nickname_before_listing();

CREATE TRIGGER collection_nickname_check
  BEFORE INSERT OR UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nickname_before_listing();

-- Create public functions that include nicknames for marketplace
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
SET search_path = 'public'
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
  WHERE n.is_listed = true 
    AND owner_profile.nickname IS NOT NULL 
    AND owner_profile.nickname != '';
$$;

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
SET search_path = 'public'
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
    AND up.nickname != '';
$$;