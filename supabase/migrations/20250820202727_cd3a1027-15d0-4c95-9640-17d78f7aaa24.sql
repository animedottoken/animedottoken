-- Fix security warning: Function Search Path Mutable
-- Set search_path for the update_collection_supply function to prevent SQL injection

CREATE OR REPLACE FUNCTION public.update_collection_supply()
RETURNS TRIGGER AS $$
BEGIN
  -- Update items_redeemed when a new NFT is minted
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections 
    SET items_redeemed = items_redeemed + 1,
        items_available = GREATEST(0, items_available - 1)
    WHERE id = NEW.collection_id;
    RETURN NEW;
  END IF;
  
  -- Handle NFT deletion (unlikely but for completeness)
  IF TG_OP = 'DELETE' THEN
    UPDATE public.collections 
    SET items_redeemed = GREATEST(0, items_redeemed - 1),
        items_available = items_available + 1
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';