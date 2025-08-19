-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.generate_collection_slug(collection_name TEXT)
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
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
$$;

-- Fix the trigger function as well
CREATE OR REPLACE FUNCTION public.collections_set_slug()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Only generate slug if it's null or empty
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.generate_collection_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$;