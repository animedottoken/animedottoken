-- Make max_supply and items_available nullable for open editions
ALTER TABLE public.collections 
ALTER COLUMN max_supply DROP NOT NULL,
ALTER COLUMN max_supply DROP DEFAULT;

ALTER TABLE public.collections 
ALTER COLUMN items_available DROP NOT NULL,
ALTER COLUMN items_available DROP DEFAULT;

-- Update existing open collections to have NULL supply values
UPDATE public.collections 
SET max_supply = NULL, items_available = NULL 
WHERE supply_mode = 'open';