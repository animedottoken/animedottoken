-- Remove overly permissive public policies that expose sensitive data

-- Drop public policies that expose sensitive wallet addresses and data
DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
DROP POLICY IF EXISTS "Public can view all NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Public can view marketplace activities" ON public.marketplace_activities;
DROP POLICY IF EXISTS "Public can view basic user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view marketplace settings" ON public.marketplace_settings;

-- These tables now rely on existing secure RPC functions for public access:
-- - get_collections_public_masked() for masked collection data
-- - get_nfts_public() for masked NFT data  
-- - get_marketplace_activities_public() for masked activity data
-- - get_profiles_public() for limited profile data
-- - get_marketplace_info_public() for basic marketplace info (fee only)

-- This ensures sensitive wallet addresses and detailed metadata are protected
-- while still allowing necessary public marketplace functionality