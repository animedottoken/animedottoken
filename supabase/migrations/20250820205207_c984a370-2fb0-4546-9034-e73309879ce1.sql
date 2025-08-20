-- Fix the security definer view issue
-- Drop and recreate the view to ensure no SECURITY DEFINER property

DROP VIEW IF EXISTS public.collections_public;

-- Create the view WITHOUT any security definer properties
-- Views by default use the permissions of the querying user, which is what we want
CREATE VIEW public.collections_public AS
SELECT 
  id,
  name,
  symbol,
  description, -- Keep for backward compatibility
  site_description,
  onchain_description,
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
  -- Mask wallet addresses for privacy
  CONCAT(LEFT(creator_address, 4), '...', RIGHT(creator_address, 4)) as creator_address,
  CONCAT(LEFT(COALESCE(treasury_wallet, creator_address), 4), '...', RIGHT(COALESCE(treasury_wallet, creator_address), 4)) as treasury_wallet,
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

-- Grant proper permissions
GRANT SELECT ON public.collections_public TO anon;
GRANT SELECT ON public.collections_public TO authenticated;