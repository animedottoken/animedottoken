-- Fix remaining security issues and restore marketplace functionality (handling existing policies)

-- 1. Fix conflicting marketplace_settings policies  
-- Remove the authenticated user policy and keep only service role access
DROP POLICY IF EXISTS "Authenticated users can view marketplace settings" ON public.marketplace_settings;

-- 2. Fix marketplace_activities table - should not be publicly readable
-- Remove public policy and ensure proper user-specific access
DROP POLICY IF EXISTS "Public can view marketplace activities" ON public.marketplace_activities;

-- Drop existing policy if it exists and recreate it properly
DROP POLICY IF EXISTS "Users can view activities they're involved in" ON public.marketplace_activities;

-- Create the proper policy for marketplace activities
CREATE POLICY "Users can view activities they're involved in"
ON public.marketplace_activities
FOR SELECT
USING (
  (from_address = (auth.jwt() ->> 'wallet_address'::text)) OR 
  (to_address = (auth.jwt() ->> 'wallet_address'::text)) OR
  (auth.role() = 'service_role'::text)
);

-- 3. Remove overly restrictive social feature policies
DROP POLICY IF EXISTS "Public can view collection like counts" ON public.collection_likes;
DROP POLICY IF EXISTS "Public can view NFT like counts" ON public.nft_likes;
DROP POLICY IF EXISTS "Public can view creator follow counts" ON public.creator_follows;

-- 4. Create a summary comment explaining the security model:
-- - Tables have restrictive RLS policies to protect direct access
-- - Security definer functions provide controlled public access with masked data
-- - Users can only see their own sensitive data through direct table access
-- - Public browsing works through functions that mask wallet addresses