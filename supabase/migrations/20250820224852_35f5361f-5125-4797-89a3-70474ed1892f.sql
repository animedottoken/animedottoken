-- Update validation function to handle optional symbol
CREATE OR REPLACE FUNCTION public.validate_collection_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure symbol is uppercase if provided (but allow NULL)
  IF NEW.symbol IS NOT NULL AND NEW.symbol != '' THEN
    NEW.symbol := UPPER(NEW.symbol);
  ELSE
    -- Set to NULL if empty string provided
    NEW.symbol := NULL;
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
$function$;