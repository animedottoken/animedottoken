-- Remove the public_profiles_limited view to resolve security definer warning
-- The view isn't strictly necessary since authenticated users can query directly

DROP VIEW IF EXISTS public.public_profiles_limited;