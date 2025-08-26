-- Fix Critical Vulnerability: Remove direct public access to boosted_listings table
-- Force all public access through secure functions that mask wallet addresses

-- Drop the overly permissive policy that allows direct public table access
DROP POLICY IF EXISTS "Public can view boost data with masked wallets" ON public.boosted_listings;

-- Create restrictive policies that protect wallet addresses
CREATE POLICY "Only authenticated users can view boost details" 
ON public.boosted_listings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own boost activity" 
ON public.boosted_listings 
FOR SELECT 
USING (
  bidder_wallet = (auth.jwt() ->> 'wallet_address') 
  OR EXISTS (
    SELECT 1 FROM public.nfts n 
    WHERE n.id = boosted_listings.nft_id 
    AND n.owner_address = (auth.jwt() ->> 'wallet_address')
  )
);

-- Update the public function to work without requiring table-level SELECT permissions
-- Make it a SECURITY DEFINER function so it can access data on behalf of users
CREATE OR REPLACE FUNCTION public.get_boosted_listings_public()
RETURNS TABLE(
  id uuid, nft_id uuid, bid_amount numeric, token_mint text,
  bidder_wallet_masked text, tx_signature text, start_time timestamptz, 
  end_time timestamptz, is_active boolean, nft_name text, nft_image_url text,
  owner_address_masked text, bid_rank bigint, tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bl.id, bl.nft_id, bl.bid_amount, bl.token_mint,
    concat(left(bl.bidder_wallet, 4), '...', right(bl.bidder_wallet, 4)) as bidder_wallet_masked,
    bl.tx_signature, bl.start_time, bl.end_time, bl.is_active,
    n.name as nft_name, n.image_url as nft_image_url,
    concat(left(n.owner_address, 4), '...', right(n.owner_address, 4)) as owner_address_masked,
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

-- Similarly, protect NFTs and collections tables from direct wallet exposure
-- Drop overly permissive policies
DROP POLICY IF EXISTS "NFTs are viewable by everyone" ON public.nfts;
DROP POLICY IF EXISTS "Users can view all NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;

-- Create restrictive policies for NFTs
CREATE POLICY "Authenticated users can view NFT details" 
ON public.nfts 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own NFTs" 
ON public.nfts 
FOR SELECT 
USING (
  owner_address = (auth.jwt() ->> 'wallet_address') 
  OR creator_address = (auth.jwt() ->> 'wallet_address')
);

-- Create restrictive policies for collections  
CREATE POLICY "Authenticated users can view collection details" 
ON public.collections 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (creator_address = (auth.jwt() ->> 'wallet_address'));

-- Update NFTs and collections functions to be SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_nfts_public()
RETURNS TABLE(
  id uuid, collection_id uuid, mint_address text, name text, symbol text,
  description text, image_url text, metadata_uri text, attributes jsonb,
  is_listed boolean, price numeric, currency text, is_featured boolean,
  owner_address_masked text, creator_address_masked text, views integer,
  featured_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    n.id, n.collection_id, n.mint_address, n.name, n.symbol,
    n.description, n.image_url, n.metadata_uri, n.attributes,
    n.is_listed, n.price, n.currency, n.is_featured,
    concat(left(n.owner_address, 4), '...', right(n.owner_address, 4)) as owner_address_masked,
    concat(left(n.creator_address, 4), '...', right(n.creator_address, 4)) as creator_address_masked,
    n.views, n.featured_at, n.created_at, n.updated_at
  FROM public.nfts n;
$$;

CREATE OR REPLACE FUNCTION public.get_collections_public_masked()
RETURNS TABLE(
  id uuid, name text, symbol text, description text, site_description text,
  onchain_description text, image_url text, banner_image_url text,
  creator_address_masked text, treasury_wallet_masked text, slug text,
  collection_mint_address text, category text, mint_price numeric,
  max_supply integer, items_available integer, items_redeemed integer,
  is_active boolean, is_live boolean, whitelist_enabled boolean,
  go_live_date timestamptz, royalty_percentage numeric, external_links jsonb,
  verified boolean, explicit_content boolean, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.symbol, c.description, c.site_description,
    c.onchain_description, c.image_url, c.banner_image_url,
    concat(left(c.creator_address, 4), '...', right(c.creator_address, 4)) as creator_address_masked,
    concat(left(c.treasury_wallet, 4), '...', right(c.treasury_wallet, 4)) as treasury_wallet_masked,
    c.slug, c.collection_mint_address, c.category, c.mint_price,
    c.max_supply, c.items_available, c.items_redeemed, c.is_active,
    c.is_live, c.whitelist_enabled, c.go_live_date, c.royalty_percentage,
    c.external_links, c.verified, c.explicit_content, c.created_at, c.updated_at
  FROM public.collections c
  WHERE c.is_active = true;
$$;

-- Keep the authenticated function as SECURITY INVOKER for proper access control
CREATE OR REPLACE FUNCTION public.get_boosted_listings_authenticated()
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
    n.name as nft_name, n.image_url as nft_image_url, n.owner_address,
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

-- Update comments to reflect the new security model
COMMENT ON FUNCTION public.get_boosted_listings_public() IS 'SECURITY DEFINER function providing public boost data with masked wallet addresses - no direct table access required';
COMMENT ON FUNCTION public.get_nfts_public() IS 'SECURITY DEFINER function providing public NFT data with masked owner/creator addresses';
COMMENT ON FUNCTION public.get_collections_public_masked() IS 'SECURITY DEFINER function providing public collection data with masked creator/treasury addresses';
COMMENT ON FUNCTION public.get_boosted_listings_authenticated() IS 'SECURITY INVOKER function for authenticated users requiring full wallet addresses for platform functionality';

COMMENT ON POLICY "Only authenticated users can view boost details" ON public.boosted_listings IS 'Restricts direct table access to authenticated users only - public access via secure functions';
COMMENT ON POLICY "Users can view their own boost activity" ON public.boosted_listings IS 'Users can always access their own boost activity directly';
COMMENT ON POLICY "Authenticated users can view NFT details" ON public.nfts IS 'Restricts NFT table access to authenticated users - public access via secure functions';
COMMENT ON POLICY "Authenticated users can view collection details" ON public.collections IS 'Restricts collection table access to authenticated users - public access via secure functions';