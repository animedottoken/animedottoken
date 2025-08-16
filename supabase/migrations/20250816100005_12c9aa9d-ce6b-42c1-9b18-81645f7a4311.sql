-- Fix the SECURITY DEFINER view warning by recreating the view without SECURITY DEFINER
-- This is safe since we're only selecting from approved submissions without exposing sensitive data

DROP VIEW IF EXISTS public.public_approved_submissions;

-- Recreate the view as a regular view (not SECURITY DEFINER)
-- This view is safe for public access as it only shows approved submissions
-- and excludes sensitive fields like contact and author_bio
CREATE VIEW public.public_approved_submissions AS
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
  cs.edition_type,
  cs.theme,
  cs.tags,
  cs.created_at
FROM public.community_submissions cs
WHERE cs.status = 'approved'::submission_status;

-- Grant select permission to anon role for the view
GRANT SELECT ON public.public_approved_submissions TO anon;