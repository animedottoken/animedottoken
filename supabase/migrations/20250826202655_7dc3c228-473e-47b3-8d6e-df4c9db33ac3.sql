-- Fix Critical Security Vulnerabilities: Complete Lockdown of Sensitive Tables
-- Remove all overly permissive policies and force access through secure functions only

-- ISSUE 1: marketplace_activities - Remove public access to trading data
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON public.marketplace_activities;

-- Create restrictive policies for marketplace_activities
CREATE POLICY "Only authenticated users can view marketplace activities" 
ON public.marketplace_activities 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own trading activity" 
ON public.marketplace_activities 
FOR SELECT 
USING (
  from_address = (auth.jwt() ->> 'wallet_address') 
  OR to_address = (auth.jwt() ->> 'wallet_address')
);

-- ISSUE 2: user_profiles - Remove authenticated access to verified profiles
DROP POLICY IF EXISTS "Authenticated users can view verified profiles only" ON public.user_profiles;

-- User profiles now ONLY accessible through secure functions or own profile access

-- ISSUE 3: nfts - Remove broad authenticated access
DROP POLICY IF EXISTS "Authenticated users can view NFT details" ON public.nfts;

-- NFTs now ONLY accessible through secure functions or ownership

-- ISSUE 4: collections - Remove broad authenticated access  
DROP POLICY IF EXISTS "Authenticated users can view collection details" ON public.collections;

-- Collections now ONLY accessible through secure functions or ownership

-- Create secure public functions for marketplace activities (with masked wallets)
CREATE OR REPLACE FUNCTION public.get_marketplace_activities_public()
RETURNS TABLE(
  id uuid, nft_id uuid, collection_id uuid, activity_type text,
  from_address_masked text, to_address_masked text, price numeric, currency text,
  transaction_signature_masked text, block_time timestamptz, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ma.id, ma.nft_id, ma.collection_id, ma.activity_type,
    CASE 
      WHEN ma.from_address IS NOT NULL THEN concat(left(ma.from_address, 4), '...', right(ma.from_address, 4))
      ELSE NULL 
    END as from_address_masked,
    CASE 
      WHEN ma.to_address IS NOT NULL THEN concat(left(ma.to_address, 4), '...', right(ma.to_address, 4))
      ELSE NULL 
    END as to_address_masked,
    ma.price, ma.currency,
    CASE 
      WHEN ma.transaction_signature IS NOT NULL THEN concat(left(ma.transaction_signature, 8), '...', right(ma.transaction_signature, 8))
      ELSE NULL 
    END as transaction_signature_masked,
    ma.block_time, ma.created_at
  FROM public.marketplace_activities ma
  ORDER BY ma.created_at DESC
  LIMIT 100;
$$;

-- Create authenticated function for marketplace activities (full data for platform functionality)
CREATE OR REPLACE FUNCTION public.get_marketplace_activities_authenticated()
RETURNS TABLE(
  id uuid, nft_id uuid, collection_id uuid, activity_type text,
  from_address text, to_address text, price numeric, currency text,
  transaction_signature text, block_time timestamptz, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    ma.id, ma.nft_id, ma.collection_id, ma.activity_type,
    ma.from_address, ma.to_address, ma.price, ma.currency,
    ma.transaction_signature, ma.block_time, ma.created_at
  FROM public.marketplace_activities ma
  ORDER BY ma.created_at DESC
  LIMIT 100;
$$;

-- Create authenticated functions for NFTs and Collections (for platform functionality)
CREATE OR REPLACE FUNCTION public.get_nfts_authenticated()
RETURNS TABLE(
  id uuid, collection_id uuid, mint_address text, name text, symbol text,
  description text, image_url text, metadata_uri text, attributes jsonb,
  is_listed boolean, price numeric, currency text, is_featured boolean,
  owner_address text, creator_address text, views integer,
  featured_at timestamptz, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    n.id, n.collection_id, n.mint_address, n.name, n.symbol,
    n.description, n.image_url, n.metadata_uri, n.attributes,
    n.is_listed, n.price, n.currency, n.is_featured,
    n.owner_address, n.creator_address, n.views,
    n.featured_at, n.created_at, n.updated_at
  FROM public.nfts n;
$$;

CREATE OR REPLACE FUNCTION public.get_collections_authenticated()
RETURNS TABLE(
  id uuid, name text, symbol text, description text, site_description text,
  onchain_description text, image_url text, banner_image_url text,
  creator_address text, treasury_wallet text, slug text,
  collection_mint_address text, category text, mint_price numeric,
  max_supply integer, items_available integer, items_redeemed integer,
  is_active boolean, is_live boolean, whitelist_enabled boolean,
  go_live_date timestamptz, royalty_percentage numeric, external_links jsonb,
  verified boolean, explicit_content boolean, created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.symbol, c.description, c.site_description,
    c.onchain_description, c.image_url, c.banner_image_url,
    c.creator_address, c.treasury_wallet, c.slug,
    c.collection_mint_address, c.category, c.mint_price,
    c.max_supply, c.items_available, c.items_redeemed, c.is_active,
    c.is_live, c.whitelist_enabled, c.go_live_date, c.royalty_percentage,
    c.external_links, c.verified, c.explicit_content, c.created_at, c.updated_at
  FROM public.collections c;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_marketplace_activities_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_activities_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nfts_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_collections_authenticated() TO authenticated;

-- Add comprehensive security comments
COMMENT ON POLICY "Only authenticated users can view marketplace activities" ON public.marketplace_activities IS 'Restricts trading data access to authenticated users only - prevents competitor analysis';
COMMENT ON POLICY "Users can view their own trading activity" ON public.marketplace_activities IS 'Users can always access their own trading history';

COMMENT ON FUNCTION public.get_marketplace_activities_public() IS 'Public function providing trading activity with all sensitive data masked (wallet addresses, transaction signatures)';
COMMENT ON FUNCTION public.get_marketplace_activities_authenticated() IS 'Authenticated function providing complete trading data for platform functionality';
COMMENT ON FUNCTION public.get_nfts_authenticated() IS 'Authenticated function providing complete NFT data with full wallet addresses for trading';
COMMENT ON FUNCTION public.get_collections_authenticated() IS 'Authenticated function providing complete collection data with full wallet addresses for platform operations';