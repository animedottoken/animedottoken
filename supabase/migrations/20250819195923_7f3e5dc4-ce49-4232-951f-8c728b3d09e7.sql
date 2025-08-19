-- Update policies to work with direct wallet address filtering
DROP POLICY "Users can view their own mint jobs" ON mint_jobs;
DROP POLICY "Users can view their own job items" ON mint_job_items;

-- Create simpler policies that allow filtering by wallet address in queries
CREATE POLICY "Users can view jobs with wallet filter" 
ON mint_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view job items with wallet filter" 
ON mint_job_items 
FOR SELECT 
USING (true);