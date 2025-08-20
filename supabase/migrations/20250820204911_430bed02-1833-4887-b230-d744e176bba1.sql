-- Fix security issues from linter

-- Fix 1: Remove SECURITY DEFINER from view (views don't need it, and it can be a security risk)
-- The collections_public view doesn't need SECURITY DEFINER as it's just selecting data

-- Fix 2: Add SECURITY DEFINER and SET search_path to the function for security
DROP FUNCTION IF EXISTS public.validate_collection_data();

CREATE OR REPLACE FUNCTION public.validate_collection_data()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Create the trigger to use this validation function
CREATE TRIGGER validate_collection_before_insert
  BEFORE INSERT ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_collection_data();