-- Add bio editing functionality with payment tracking

-- Add bio_unlock_status column to track if user has unlocked bio editing
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS bio_unlock_status boolean DEFAULT false;

-- Create function to handle bio setting with payment
CREATE OR REPLACE FUNCTION public.handle_bio_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If bio is being set for the first time, unlock bio editing for free
  IF OLD.bio IS NULL AND NEW.bio IS NOT NULL AND OLD.bio_unlock_status = false THEN
    NEW.bio_unlock_status := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bio updates
DROP TRIGGER IF EXISTS bio_update_trigger ON public.user_profiles;
CREATE TRIGGER bio_update_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bio_update();