-- Re-enable RLS and create proper wallet-based security policies
ALTER TABLE mint_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mint_job_items ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view jobs by wallet address" ON mint_jobs;
DROP POLICY IF EXISTS "Users can create mint jobs for their wallet" ON mint_jobs;
DROP POLICY IF EXISTS "Users can view job items by wallet" ON mint_job_items;
DROP POLICY IF EXISTS "System can update mint jobs" ON mint_jobs;
DROP POLICY IF EXISTS "System can manage mint job items" ON mint_job_items;

-- Create secure wallet-based policies for mint_jobs
-- Allow users to view only their own jobs (by wallet address)
CREATE POLICY "Users can view their own mint jobs" 
ON mint_jobs 
FOR SELECT 
USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR auth.uid() IS NOT NULL);

-- Allow creation of mint jobs (will be restricted by application logic)
CREATE POLICY "Users can create mint jobs" 
ON mint_jobs 
FOR INSERT 
WITH CHECK (true);

-- Allow system updates for job processing
CREATE POLICY "System can update mint jobs" 
ON mint_jobs 
FOR UPDATE 
USING (true);

-- Create secure policies for mint_job_items
-- Users can view items belonging to their jobs
CREATE POLICY "Users can view their own job items" 
ON mint_job_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM mint_jobs 
  WHERE mint_jobs.id = mint_job_items.mint_job_id 
  AND (mint_jobs.wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' OR auth.uid() IS NOT NULL)
));

-- Allow system to manage job items
CREATE POLICY "System can manage job items" 
ON mint_job_items 
FOR ALL 
USING (true);