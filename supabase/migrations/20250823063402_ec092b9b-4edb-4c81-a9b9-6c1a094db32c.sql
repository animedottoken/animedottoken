
-- Add a column to store collection-level attributes
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Optional: document the column
COMMENT ON COLUMN public.collections.attributes IS 'Array of trait objects for the collection (e.g., [{ "trait_type": "YEAR", "value": "2005", "display_type": "number" }]).';
