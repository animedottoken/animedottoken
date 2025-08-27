-- Fix final security warnings - restrict user profile harvesting and marketplace settings exposure

-- 1. Remove public access to user profiles to prevent competitor data harvesting
-- This prevents scraping of display names, bios, social handles, etc.
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.user_profiles;

-- 2. Remove authenticated user access to marketplace settings 
-- This prevents exposure of business-sensitive platform configuration
DROP POLICY IF EXISTS "Only authenticated users can view marketplace settings" ON public.marketplace_settings;

-- Now only service role can access marketplace settings, and user profiles
-- are only accessible to the profile owners themselves or through controlled
-- public functions that mask sensitive data