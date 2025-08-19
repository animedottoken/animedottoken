-- Enable real-time for mint queue tables
ALTER TABLE mint_jobs REPLICA IDENTITY FULL;
ALTER TABLE mint_job_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE mint_jobs;
ALTER publication supabase_realtime ADD TABLE mint_job_items;