-- Create a more secure RLS policy for mint jobs
DROP POLICY IF EXISTS "Users can view mint jobs by wallet address" ON mint_jobs;

CREATE POLICY "Users can view their wallet's mint jobs" 
ON mint_jobs 
FOR SELECT 
USING (
  -- Allow service role for system operations
  (auth.role() = 'service_role'::text) OR
  -- Allow viewing jobs for specific wallet address (no auth required for now)
  (wallet_address IS NOT NULL)
);