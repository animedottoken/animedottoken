-- Create payments table for tracking collection banner change payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  payment_type TEXT NOT NULL, -- e.g., 'banner_change'
  amount_usdt NUMERIC NOT NULL,
  amount_anime NUMERIC NOT NULL,
  anime_price NUMERIC NOT NULL,
  tx_signature TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Allow service role to insert and update payments (for edge functions)
CREATE POLICY "Service role can manage payments" 
ON public.payments 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_payments_tx_signature ON public.payments(tx_signature);
CREATE INDEX idx_payments_collection_id ON public.payments(collection_id);
CREATE INDEX idx_payments_wallet_address ON public.payments(wallet_address);