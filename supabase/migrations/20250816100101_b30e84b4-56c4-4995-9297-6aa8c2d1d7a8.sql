-- Since we're making this a fully static site, let's remove all the backend database structure
-- This will eliminate all security concerns and warnings

-- Drop the view that's causing the security definer warning
DROP VIEW IF EXISTS public.public_approved_submissions;

-- Drop all the tables we don't need for a static site
DROP TABLE IF EXISTS public.featured_content CASCADE;
DROP TABLE IF EXISTS public.community_submissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Drop the custom types
DROP TYPE IF EXISTS public.submission_type CASCADE;
DROP TYPE IF EXISTS public.submission_status CASCADE;
DROP TYPE IF EXISTS public.submission_source CASCADE;
DROP TYPE IF EXISTS public.edition_type CASCADE;
DROP TYPE IF EXISTS public.theme_type CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop the functions that are no longer needed
DROP FUNCTION IF EXISTS public.get_public_submissions() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;