-- Fix security issue: Update function to have proper search path
CREATE OR REPLACE FUNCTION public.handle_bio_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- If bio is being set for the first time, unlock bio editing for free
  IF OLD.bio IS NULL AND NEW.bio IS NOT NULL AND OLD.bio_unlock_status = false THEN
    NEW.bio_unlock_status := true;
  END IF;
  
  RETURN NEW;
END;
$$;