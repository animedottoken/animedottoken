-- Fix remaining functions missing SET search_path TO 'public'

-- Recreate handle_bio_update function with proper search_path (in case it's missing)
CREATE OR REPLACE FUNCTION public.handle_bio_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If bio is being set for the first time, unlock bio editing for free
  IF OLD.bio IS NULL AND NEW.bio IS NOT NULL AND OLD.bio_unlock_status = false THEN
    NEW.bio_unlock_status := true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate handle_first_pfp_update function with proper search_path (in case it's missing)
CREATE OR REPLACE FUNCTION public.handle_first_pfp_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If profile_image_url is being set for the first time, unlock PFP for free
  IF OLD.profile_image_url IS NULL AND NEW.profile_image_url IS NOT NULL AND OLD.pfp_unlock_status = false THEN
    NEW.pfp_unlock_status := true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate handle_nft_burn function with proper search_path (in case it's missing)
CREATE OR REPLACE FUNCTION public.handle_nft_burn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;