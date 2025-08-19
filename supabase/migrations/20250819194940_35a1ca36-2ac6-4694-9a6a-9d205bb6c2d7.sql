-- More secure: Filter jobs by wallet address in RLS
DROP POLICY IF EXISTS "Users can view jobs by wallet address" ON mint_jobs;
DROP POLICY IF EXISTS "Anyone can create mint jobs" ON mint_jobs;
DROP POLICY IF EXISTS "Anyone can view mint job items" ON mint_job_items;

-- Create wallet-based RLS policies
CREATE POLICY "Users can view jobs by wallet address" 
ON mint_jobs 
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address') OR auth.uid() IS NULL);

CREATE POLICY "Users can create mint jobs for their wallet" 
ON mint_jobs 
FOR INSERT 
WITH CHECK (true);

-- For job items, check through the parent job's wallet address
CREATE POLICY "Users can view job items by wallet" 
ON mint_job_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM mint_jobs 
  WHERE mint_jobs.id = mint_job_items.mint_job_id 
  AND (mint_jobs.wallet_address = (auth.jwt() ->> 'wallet_address') OR auth.uid() IS NULL)
));