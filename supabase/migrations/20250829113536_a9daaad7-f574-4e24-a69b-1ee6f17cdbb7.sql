-- Create a secure function to get unmasked creator wallet address for a collection
CREATE OR REPLACE FUNCTION public.get_collection_creator_wallet(collection_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  creator_wallet text;
BEGIN
  SELECT creator_address INTO creator_wallet
  FROM public.collections
  WHERE id = collection_id;
  
  RETURN creator_wallet;
END;
$function$;