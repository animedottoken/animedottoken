-- Fix creator wallet addresses exposed to public
-- Create a secure public view that masks sensitive wallet information

-- Create a view for public collection data with masked wallet addresses
CREATE OR REPLACE VIEW public.collections_public AS
SELECT 
  id,
  name,
  symbol,
  description,
  image_url,
  banner_image_url,
  mint_price,
  max_supply,
  items_available,
  items_redeemed,
  is_active,
  is_live,
  whitelist_enabled,
  go_live_date,
  royalty_percentage,
  -- Mask creator and treasury wallet addresses for privacy
  CASE 
    WHEN creator_address = (auth.jwt() ->> 'wallet_address'::text) THEN creator_address
    ELSE CONCAT(LEFT(creator_address, 4), '...', RIGHT(creator_address, 4))
  END as creator_address,
  CASE 
    WHEN creator_address = (auth.jwt() ->> 'wallet_address'::text) THEN treasury_wallet
    ELSE CONCAT(LEFT(treasury_wallet, 4), '...', RIGHT(treasury_wallet, 4))
  END as treasury_wallet,
  slug,
  external_links,
  collection_mint_address,
  verified,
  category,
  explicit_content,
  candy_machine_id,
  created_at,
  updated_at
FROM public.collections
WHERE is_active = true;

-- Enable RLS on the view
ALTER VIEW public.collections_public SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON public.collections_public TO anon;
GRANT SELECT ON public.collections_public TO authenticated;

-- Create a function to get collection details with appropriate access level
CREATE OR REPLACE FUNCTION public.get_collection_details(collection_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  symbol text,
  description text,
  image_url text,
  banner_image_url text,
  mint_price numeric,
  max_supply integer,
  items_available integer,
  items_redeemed integer,
  is_active boolean,
  is_live boolean,
  whitelist_enabled boolean,
  go_live_date timestamp with time zone,
  royalty_percentage numeric,
  creator_address text,
  treasury_wallet text,
  slug text,
  external_links jsonb,
  collection_mint_address text,
  verified boolean,
  category text,
  explicit_content boolean,
  candy_machine_id text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  -- Return full details if user is the creator, masked details otherwise
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.symbol,
    c.description,
    c.image_url,
    c.banner_image_url,
    c.mint_price,
    c.max_supply,
    c.items_available,
    c.items_redeemed,
    c.is_active,
    c.is_live,
    c.whitelist_enabled,
    c.go_live_date,
    c.royalty_percentage,
    CASE 
      WHEN c.creator_address = (auth.jwt() ->> 'wallet_address'::text) THEN c.creator_address
      ELSE CONCAT(LEFT(c.creator_address, 4), '...', RIGHT(c.creator_address, 4))
    END::text as creator_address,
    CASE 
      WHEN c.creator_address = (auth.jwt() ->> 'wallet_address'::text) THEN c.treasury_wallet
      ELSE CONCAT(LEFT(c.treasury_wallet, 4), '...', RIGHT(c.treasury_wallet, 4))
    END::text as treasury_wallet,
    c.slug,
    c.external_links,
    c.collection_mint_address,
    c.verified,
    c.category,
    c.explicit_content,
    c.candy_machine_id,
    c.created_at,
    c.updated_at
  FROM public.collections c
  WHERE c.id = collection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';