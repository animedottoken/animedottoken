-- Update RLS policy to allow users to view mint jobs by wallet address without requiring authentication
DROP POLICY IF EXISTS "Users can only view their own mint jobs" ON mint_jobs;

CREATE POLICY "Users can view mint jobs by wallet address" 
ON mint_jobs 
FOR SELECT 
USING (
  -- Allow if authenticated user's wallet matches
  (auth.jwt() ->> 'wallet_address'::text = wallet_address) OR
  -- Allow service role for system operations
  (auth.role() = 'service_role'::text) OR
  -- Allow public access (temporary for development)
  true
);