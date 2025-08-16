-- Add new fields to community_submissions table to support the new submission form structure
ALTER TABLE public.community_submissions 
ADD COLUMN IF NOT EXISTS artist_nickname text,
ADD COLUMN IF NOT EXISTS price text,
ADD COLUMN IF NOT EXISTS solscan_link text;

-- Update author field to be nullable since we're using artist_nickname now
ALTER TABLE public.community_submissions 
ALTER COLUMN author DROP NOT NULL;

-- Update the get_public_submissions function to include the new fields
CREATE OR REPLACE FUNCTION public.get_public_submissions()
 RETURNS TABLE(id uuid, image_url text, name text, caption text, author text, artist_nickname text, price text, solscan_link text, type submission_type, status submission_status, submission_source submission_source, created_at timestamp with time zone, updated_at timestamp with time zone, edition_type edition_type, theme theme_type, tags text[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    SELECT 
        cs.id,
        cs.image_url,
        cs.name,
        cs.caption,
        cs.author,
        cs.artist_nickname,
        cs.price,
        cs.solscan_link,
        cs.type,
        cs.status,
        cs.submission_source,
        cs.created_at,
        cs.updated_at,
        cs.edition_type,
        cs.theme,
        cs.tags
    FROM community_submissions cs
    WHERE cs.status = 'approved'::submission_status
    ORDER BY cs.created_at DESC;
$function$