-- Update RLS policies for mint_jobs to work with wallet-only authentication
DROP POLICY IF EXISTS "Users can view their own mint jobs" ON mint_jobs;
DROP POLICY IF EXISTS "Users can create their own mint jobs" ON mint_jobs;

-- Allow users to view jobs by wallet address (no auth required)
CREATE POLICY "Users can view jobs by wallet address" 
ON mint_jobs 
FOR SELECT 
USING (true);

-- Allow job creation without auth requirements
CREATE POLICY "Anyone can create mint jobs" 
ON mint_jobs 
FOR INSERT 
WITH CHECK (true);

-- Update RLS for mint_job_items to work with wallet-based access
DROP POLICY IF EXISTS "Users can view their own mint job items" ON mint_job_items;

CREATE POLICY "Anyone can view mint job items" 
ON mint_job_items 
FOR SELECT 
USING (true);