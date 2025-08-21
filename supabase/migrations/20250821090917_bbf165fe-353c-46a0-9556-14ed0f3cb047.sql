-- Address the security linter warning by removing SECURITY DEFINER from collections_public view
-- The view should use the permissions of the querying user, not the view creator

DROP VIEW IF EXISTS public.collections_public;

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
  CONCAT(LEFT(creator_address, 4), '...', RIGHT(creator_address, 4)) as creator_address,
  CONCAT(LEFT(treasury_wallet, 4), '...', RIGHT(treasury_wallet, 4)) as treasury_wallet,
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