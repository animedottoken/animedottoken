-- Check what the current constraint is
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'collections_royalty_valid';

-- Drop the old constraint
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_royalty_valid;

-- Add the new constraint that allows up to 50%
ALTER TABLE public.collections ADD CONSTRAINT collections_royalty_valid 
CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50);