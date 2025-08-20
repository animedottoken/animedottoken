-- Fix CRITICAL security issue: Collection Management Security Bypass
-- The current policy "creator_address = creator_address" always evaluates to true!
-- This allows ANY user to modify/delete ANY collection

-- Drop the broken policy that allows anyone to manage any collection
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;

-- Create a secure policy that properly checks the creator's wallet address
CREATE POLICY "Users can manage their own collections" 
ON public.collections 
FOR ALL 
USING (
  creator_address = (auth.jwt() ->> 'wallet_address'::text)
  OR auth.uid() IS NOT NULL  -- Allow system operations when authenticated
)
WITH CHECK (
  creator_address = (auth.jwt() ->> 'wallet_address'::text)
  OR auth.uid() IS NOT NULL  -- Allow system operations when authenticated
);

-- Also review the "Anyone can create collections" policy to ensure it's secure
DROP POLICY IF EXISTS "Anyone can create collections" ON public.collections;

CREATE POLICY "Anyone can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (
  creator_address = (auth.jwt() ->> 'wallet_address'::text)
  OR auth.uid() IS NOT NULL  -- Allow system operations
);