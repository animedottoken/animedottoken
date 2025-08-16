-- Remove public access to sensitive contact data in community_submissions
-- 1) Drop policy that allowed public SELECT on the base table
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.community_submissions;

-- Ensure RLS remains enabled (safety)
ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;

-- 2) Provide a safe public view that excludes sensitive columns like "contact" and "author_bio"
CREATE OR REPLACE VIEW public.public_approved_submissions AS
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

-- 3) Revoke any lingering direct grants on the base table to anon (defense in depth)
REVOKE ALL ON TABLE public.community_submissions FROM anon;

-- 4) Allow anon (public) to read only from the safe view
GRANT SELECT ON public.public_approved_submissions TO anon;