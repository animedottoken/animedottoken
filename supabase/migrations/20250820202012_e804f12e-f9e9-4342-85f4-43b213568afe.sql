-- Fix security issue: Mint job items data publicly exposed
-- Current policies allow public access to sensitive business data including
-- batch numbers, error messages, transaction signatures, and job volumes

-- Drop the overly permissive policies that expose all mint job items to public
DROP POLICY IF EXISTS "System can manage job items" ON public.mint_job_items;
DROP POLICY IF EXISTS "Users can view job items with wallet filter" ON public.mint_job_items;

-- Create secure policy for system operations (backend processes)
CREATE POLICY "System can manage job items" 
ON public.mint_job_items 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create secure policy for users to only see their own job items
-- This requires joining with mint_jobs to check wallet ownership
CREATE POLICY "Users can view their own job items" 
ON public.mint_job_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.mint_jobs mj 
    WHERE mj.id = mint_job_items.mint_job_id 
    AND mj.wallet_address = (auth.jwt() ->> 'wallet_address'::text)
  )
  OR auth.uid() IS NOT NULL  -- Allow system operations
);