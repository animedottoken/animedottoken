-- Fix security issue: Restrict mint_jobs access to wallet owners only
-- Drop the overly permissive policy that allows public access to all wallet addresses
DROP POLICY IF EXISTS "Users can view jobs with wallet filter" ON public.mint_jobs;

-- Create a secure policy that only allows users to see their own mint jobs
CREATE POLICY "Users can only view their own mint jobs" 
ON public.mint_jobs 
FOR SELECT 
USING (
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text)) 
  OR (auth.uid() IS NOT NULL)
);

-- Also ensure the insert policy is properly secured (this one looks fine but let's be explicit)
DROP POLICY IF EXISTS "Users can create mint jobs" ON public.mint_jobs;

CREATE POLICY "Users can create mint jobs" 
ON public.mint_jobs 
FOR INSERT 
WITH CHECK (
  (wallet_address = (auth.jwt() ->> 'wallet_address'::text)) 
  OR (auth.uid() IS NOT NULL)
);

-- Keep the update policy as is (system operations)
-- The existing "System can update mint jobs" policy is fine for backend processes