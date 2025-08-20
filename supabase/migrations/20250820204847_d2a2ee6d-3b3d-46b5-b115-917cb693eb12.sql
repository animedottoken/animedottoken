-- Add separate description fields for on-chain vs site-only content
-- Add validation constraints for collection creation
-- Improve field structure based on SolSea analysis

-- Add new columns for better description handling
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS site_description TEXT,
ADD COLUMN IF NOT EXISTS onchain_description TEXT;

-- Update existing description data - migrate to site_description
UPDATE public.collections 
SET site_description = description 
WHERE description IS NOT NULL AND site_description IS NULL;

-- Add validation constraints
ALTER TABLE public.collections 
ADD CONSTRAINT collections_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 32),
ADD CONSTRAINT collections_symbol_length CHECK (symbol IS NULL OR (char_length(symbol) >= 2 AND char_length(symbol) <= 10)),
ADD CONSTRAINT collections_site_desc_length CHECK (site_description IS NULL OR char_length(site_description) <= 2000),
ADD CONSTRAINT collections_onchain_desc_length CHECK (onchain_description IS NULL OR char_length(onchain_description) <= 200),
ADD CONSTRAINT collections_max_supply_valid CHECK (max_supply > 0 AND max_supply <= 100000),
ADD CONSTRAINT collections_mint_price_valid CHECK (mint_price >= 0),
ADD CONSTRAINT collections_royalty_valid CHECK (royalty_percentage >= 0 AND royalty_percentage <= 20);

-- Update the collections_public view to include new fields
DROP VIEW IF EXISTS public.collections_public;

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

-- Grant access to the updated view
GRANT SELECT ON public.collections_public TO anon;
GRANT SELECT ON public.collections_public TO authenticated;

-- Create function to validate collection before creation
CREATE OR REPLACE FUNCTION public.validate_collection_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure symbol is uppercase if provided
  IF NEW.symbol IS NOT NULL THEN
    NEW.symbol := UPPER(NEW.symbol);
  END IF;
  
  -- Auto-generate items_available from max_supply if not set
  IF NEW.max_supply IS NOT NULL AND NEW.items_available IS NULL THEN
    NEW.items_available := NEW.max_supply;
  END IF;
  
  -- Ensure treasury_wallet defaults to creator_address if not provided
  IF NEW.treasury_wallet IS NULL OR NEW.treasury_wallet = '' THEN
    NEW.treasury_wallet := NEW.creator_address;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;