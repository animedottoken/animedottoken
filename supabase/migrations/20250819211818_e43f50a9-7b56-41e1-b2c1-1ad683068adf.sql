-- Add new fields to collections table for better collection management
ALTER TABLE public.collections 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS external_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS collection_mint_address TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS explicit_content BOOLEAN DEFAULT FALSE;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS collections_slug_idx ON public.collections(slug);

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_collection_slug(collection_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert name to lowercase, replace spaces and special chars with hyphens
    base_slug := lower(regexp_replace(trim(collection_name), '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    
    -- Remove leading/trailing hyphens
    base_slug := trim(base_slug, '-');
    
    -- Ensure it's not empty
    IF base_slug = '' THEN
        base_slug := 'collection';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.collections WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.collections_set_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate slug if it's null or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_collection_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS collections_set_slug_trigger ON public.collections;
CREATE TRIGGER collections_set_slug_trigger
    BEFORE INSERT OR UPDATE ON public.collections
    FOR EACH ROW
    EXECUTE FUNCTION public.collections_set_slug();

-- Update existing collections to have slugs
UPDATE public.collections 
SET slug = public.generate_collection_slug(name) 
WHERE slug IS NULL OR slug = '';