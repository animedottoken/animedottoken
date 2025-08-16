-- Remove the problematic public_submissions view entirely
-- We've replaced it with the get_public_submissions() function which doesn't have security definer issues

DROP VIEW IF EXISTS public.public_submissions;

-- Note: The functionality is now provided by the public.get_public_submissions() function
-- which uses SECURITY INVOKER and has proper search_path set