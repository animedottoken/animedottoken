-- Update the get_collection_details function to return all necessary fields
CREATE OR REPLACE FUNCTION public.get_collection_details(collection_id uuid)
 RETURNS TABLE(id uuid, name text, symbol text, description text, site_description text, onchain_description text, image_url text, banner_image_url text, mint_price numeric, max_supply integer, items_available integer, items_redeemed integer, is_active boolean, is_live boolean, whitelist_enabled boolean, go_live_date timestamp with time zone, royalty_percentage numeric, creator_address text, treasury_wallet text, slug text, external_links jsonb, collection_mint_address text, verified boolean, category text, explicit_content boolean, candy_machine_id text, created_at timestamp with time zone, updated_at timestamp with time zone, supply_mode text, mint_end_at timestamp with time zone, attributes jsonb, locked_fields jsonb, enable_primary_sales boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return full details if user is the creator, masked details otherwise
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.symbol,
    c.description,
    c.site_description,
    c.onchain_description,
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
    c.updated_at,
    c.supply_mode,
    c.mint_end_at,
    c.attributes,
    c.locked_fields,
    c.enable_primary_sales
  FROM public.collections c
  WHERE c.id = collection_id;
END;
$function$