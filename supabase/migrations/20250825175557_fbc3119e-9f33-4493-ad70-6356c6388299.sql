-- Create payments table for tracking banner change payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  payment_type TEXT NOT NULL, -- 'banner_change'
  amount_usdt NUMERIC NOT NULL,
  amount_anime NUMERIC NOT NULL,
  anime_price NUMERIC NOT NULL, -- ANIME price in USDT at time of payment
  tx_signature TEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "System can manage payments" 
ON public.payments 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger to prevent avatar changes after first mint
CREATE OR REPLACE FUNCTION public.prevent_avatar_change_after_mint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if avatar is being changed and collection has minted items
  IF OLD.image_url IS DISTINCT FROM NEW.image_url AND OLD.items_redeemed > 0 THEN
    RAISE EXCEPTION 'Avatar cannot be changed after the first NFT is minted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;