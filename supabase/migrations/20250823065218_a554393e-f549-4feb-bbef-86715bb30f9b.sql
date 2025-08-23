-- Add trigger to update collection supply counters when NFTs are minted or deleted
CREATE OR REPLACE FUNCTION public.update_collection_supply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update items_redeemed when a new NFT is minted
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections 
    SET items_redeemed = items_redeemed + 1,
        items_available = GREATEST(0, items_available - 1)
    WHERE id = NEW.collection_id;
    RETURN NEW;
  END IF;
  
  -- Handle NFT deletion (restore supply)
  IF TG_OP = 'DELETE' THEN
    UPDATE public.collections 
    SET items_redeemed = GREATEST(0, items_redeemed - 1),
        items_available = items_available + 1
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create trigger for NFTs table to automatically update collection supply
DROP TRIGGER IF EXISTS trigger_update_collection_supply ON public.nfts;
CREATE TRIGGER trigger_update_collection_supply
    AFTER INSERT OR DELETE ON public.nfts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_collection_supply();