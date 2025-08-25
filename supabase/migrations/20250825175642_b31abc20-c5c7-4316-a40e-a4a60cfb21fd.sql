-- Fix the function security and add the trigger
CREATE OR REPLACE FUNCTION public.prevent_avatar_change_after_mint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if avatar is being changed and collection has minted items
  IF OLD.image_url IS DISTINCT FROM NEW.image_url AND OLD.items_redeemed > 0 THEN
    RAISE EXCEPTION 'Avatar cannot be changed after the first NFT is minted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Create the trigger for avatar protection
CREATE TRIGGER prevent_avatar_change 
  BEFORE UPDATE ON public.collections
  FOR EACH ROW 
  EXECUTE FUNCTION public.prevent_avatar_change_after_mint();