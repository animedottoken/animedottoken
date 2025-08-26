-- Fix burn-nft data integrity issue
-- The current burn-nft function incorrectly updates collection counters
-- We need to ensure proper counter management with database triggers

-- Create a trigger to properly handle NFT deletion and collection counter updates
CREATE OR REPLACE FUNCTION public.handle_nft_burn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only update collection counters if the NFT belonged to a collection
  IF OLD.collection_id IS NOT NULL THEN
    -- Increment items_available (restore supply)
    -- Decrement items_redeemed (reduce minted count)
    UPDATE public.collections 
    SET 
      items_redeemed = GREATEST(0, items_redeemed - 1),
      items_available = items_available + 1,
      updated_at = now()
    WHERE id = OLD.collection_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger for NFT burn operations
DROP TRIGGER IF EXISTS on_nft_burn ON public.nfts;
CREATE TRIGGER on_nft_burn
  AFTER DELETE ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_nft_burn();