-- Fix Critical Security Vulnerability: Collection Ownership Validation
-- Replace dangerous policies that use 'true' conditions allowing any authenticated user
-- to modify or delete any collection with proper creator validation

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Creators can update their collections" ON public.collections;

-- Drop the overly permissive DELETE policy
DROP POLICY IF EXISTS "Creators can delete their collections" ON public.collections;

-- Create secure UPDATE policy with proper creator validation
CREATE POLICY "Creators can update their own collections" 
ON public.collections 
FOR UPDATE 
USING (creator_address = (auth.jwt() ->> 'wallet_address'))
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'));

-- Create secure DELETE policy with proper creator validation
CREATE POLICY "Creators can delete their own collections" 
ON public.collections 
FOR DELETE 
USING (creator_address = (auth.jwt() ->> 'wallet_address'));

-- Add security comments
COMMENT ON POLICY "Creators can update their own collections" ON public.collections IS 'Ensures only the actual collection creator (verified by wallet address) can update their collection';
COMMENT ON POLICY "Creators can delete their own collections" ON public.collections IS 'Ensures only the actual collection creator (verified by wallet address) can delete their collection';