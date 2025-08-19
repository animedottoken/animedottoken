-- Create mint_jobs table to track minting requests
CREATE TABLE public.mint_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  total_quantity INTEGER NOT NULL CHECK (total_quantity > 0 AND total_quantity <= 1000),
  completed_quantity INTEGER NOT NULL DEFAULT 0,
  failed_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create mint_job_items table to track individual NFT minting within a job
CREATE TABLE public.mint_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_job_id UUID NOT NULL REFERENCES public.mint_jobs(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  nft_mint_address TEXT,
  transaction_signature TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mint_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mint_job_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mint_jobs
CREATE POLICY "Users can view their own mint jobs" 
ON public.mint_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mint jobs" 
ON public.mint_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update mint jobs" 
ON public.mint_jobs 
FOR UPDATE 
USING (true);

-- RLS Policies for mint_job_items
CREATE POLICY "Users can view their own mint job items" 
ON public.mint_job_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.mint_jobs mj 
  WHERE mj.id = mint_job_items.mint_job_id 
  AND mj.user_id = auth.uid()
));

CREATE POLICY "System can manage mint job items" 
ON public.mint_job_items 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_mint_jobs_status ON public.mint_jobs(status);
CREATE INDEX idx_mint_jobs_user_id ON public.mint_jobs(user_id);
CREATE INDEX idx_mint_jobs_created_at ON public.mint_jobs(created_at);
CREATE INDEX idx_mint_job_items_job_id ON public.mint_job_items(mint_job_id);
CREATE INDEX idx_mint_job_items_status ON public.mint_job_items(status);
CREATE INDEX idx_mint_job_items_batch ON public.mint_job_items(mint_job_id, batch_number);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_mint_jobs_updated_at
  BEFORE UPDATE ON public.mint_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mint_job_items_updated_at
  BEFORE UPDATE ON public.mint_job_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER TABLE public.mint_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.mint_job_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.mint_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mint_job_items;