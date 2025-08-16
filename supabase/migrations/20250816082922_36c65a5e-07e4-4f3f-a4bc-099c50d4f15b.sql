-- Enable Row Level Security on the public_submissions view
ALTER VIEW public_submissions SET (security_barrier = true);

-- Create RLS policy to allow public read access to approved submissions
-- Since this view contains approved submissions meant for public display,
-- we allow public read access but could later add more granular controls if needed
CREATE POLICY "Allow public read access to approved submissions" 
ON public.public_submissions 
FOR SELECT 
USING (true);

-- However, for better security, let's recreate the view to exclude potentially sensitive fields
-- and only include the essential information needed for public display
DROP VIEW IF EXISTS public.public_submissions;

CREATE VIEW public.public_submissions 
WITH (security_barrier = true) AS
SELECT 
    id,
    image_url,
    name,
    caption,
    author,
    type,
    status,
    submission_source,
    created_at,
    updated_at,
    edition_type,
    theme,
    nft_address,
    tags
    -- Explicitly excluding author_bio as it may contain sensitive personal information
    -- Contact information is already not included which is good
FROM community_submissions
WHERE status = 'approved'::submission_status;

-- Enable RLS on the recreated view
ALTER VIEW public.public_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to the view
CREATE POLICY "Public can view approved submissions" 
ON public.public_submissions 
FOR SELECT 
USING (true);