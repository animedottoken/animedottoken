-- Tighten public data exposure: remove over-permissive SELECT policies and rely on SECURITY DEFINER RPCs

-- 1) Collections: prevent public from selecting full rows
DROP POLICY IF EXISTS "Public can view active collections for marketplace" ON public.collections;

-- 2) NFTs: prevent public from selecting full rows (owner/creator addresses exposed)
DROP POLICY IF EXISTS "Public can view listed NFTs for marketplace" ON public.nfts;

-- 3) Marketplace activities: remove broad visibility for all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view marketplace activities" ON public.marketplace_activities;

-- Notes:
-- - Public pages must use SECURITY DEFINER RPCs which already exist:
--   get_collections_public_masked, get_nfts_public, get_marketplace_activities_public_masked
-- - These functions return masked addresses and a safe subset of fields, bypassing table RLS safely.
