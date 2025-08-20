-- Fix core issue: Collections table RLS policy exposes wallet addresses
-- Replace the overly permissive policy with secure access control

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Collections are viewable by everyone" ON public.collections;

-- Create a secure policy that masks sensitive wallet data for public access
CREATE POLICY "Collections public access with masked wallets" 
ON public.collections 
FOR SELECT 
USING (
  -- Always allow access, but the application should use the secure view or function
  -- This policy exists for backwards compatibility but apps should migrate to collections_public view
  true
);

-- However, since we can't easily mask data in RLS policies, we need to restrict direct table access
-- and encourage use of the secure view instead

-- Update to a more restrictive approach: only allow full access to creators
DROP POLICY IF EXISTS "Collections public access with masked wallets" ON public.collections;

-- Creators can see their own collections with full details
CREATE POLICY "Creators can view their own collections" 
ON public.collections 
FOR SELECT 
USING (creator_address = (auth.jwt() ->> 'wallet_address'::text) OR auth.role() = 'service_role');

-- Public can view basic collection info (non-sensitive fields only) via the secure view
-- Remove direct public access to the table to force use of the secure view

-- Grant proper permissions to the secure view
REVOKE SELECT ON public.collections FROM anon;
REVOKE SELECT ON public.collections FROM authenticated;

-- Ensure the public view has the right permissions
GRANT SELECT ON public.collections_public TO anon;
GRANT SELECT ON public.collections_public TO authenticated;

-- Create an additional policy for system operations and collection management
CREATE POLICY "System can manage collections" 
ON public.collections 
FOR ALL 
USING (auth.role() = 'service_role');

-- Allow authenticated users to insert collections (for creating new ones)
CREATE POLICY "Authenticated users can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'::text) OR auth.role() = 'service_role');

-- Allow creators to update their own collections
CREATE POLICY "Creators can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (creator_address = (auth.jwt() ->> 'wallet_address'::text) OR auth.role() = 'service_role')
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'::text) OR auth.role() = 'service_role');