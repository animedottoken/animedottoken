-- Create user_wallets table for Multi-Wallet Profile system
CREATE TABLE public.user_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('primary', 'secondary')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_signature TEXT,
  verification_message TEXT,
  linked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure each user can only have one primary wallet
  CONSTRAINT unique_primary_wallet_per_user UNIQUE (user_id, wallet_type) DEFERRABLE INITIALLY DEFERRED,
  -- Ensure wallet addresses are unique across the platform
  CONSTRAINT unique_wallet_address UNIQUE (wallet_address),
  -- Ensure user can't exceed secondary wallet limit (10)
  CONSTRAINT check_secondary_wallet_limit CHECK (
    wallet_type = 'primary' OR 
    (SELECT COUNT(*) FROM public.user_wallets uw WHERE uw.user_id = user_wallets.user_id AND uw.wallet_type = 'secondary') <= 10
  )
);

-- Enable Row Level Security
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own wallets" 
ON public.user_wallets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wallets" 
ON public.user_wallets 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND is_verified = false);

CREATE POLICY "Users can update their own unverified wallets" 
ON public.user_wallets 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own secondary wallets" 
ON public.user_wallets 
FOR DELETE 
USING (user_id = auth.uid() AND wallet_type = 'secondary');

CREATE POLICY "Service role can manage all wallets" 
ON public.user_wallets 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: Convert existing user_profiles.wallet_address to primary wallets
INSERT INTO public.user_wallets (user_id, wallet_address, wallet_type, is_verified, linked_at)
SELECT 
  user_id,
  wallet_address,
  'primary',
  true,
  created_at
FROM public.user_profiles 
WHERE user_id IS NOT NULL AND wallet_address IS NOT NULL
ON CONFLICT (wallet_address) DO NOTHING;

-- Create function to get user's primary wallet
CREATE OR REPLACE FUNCTION public.get_user_primary_wallet(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT wallet_address 
    FROM public.user_wallets 
    WHERE user_id = p_user_id AND wallet_type = 'primary' AND is_verified = true
  );
END;
$$;

-- Create function to get all user wallets
CREATE OR REPLACE FUNCTION public.get_user_wallets(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  wallet_address TEXT,
  wallet_type TEXT,
  is_verified BOOLEAN,
  linked_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uw.id,
    uw.wallet_address,
    uw.wallet_type,
    uw.is_verified,
    uw.linked_at
  FROM public.user_wallets uw
  WHERE uw.user_id = p_user_id AND uw.is_verified = true
  ORDER BY 
    CASE WHEN uw.wallet_type = 'primary' THEN 0 ELSE 1 END,
    uw.linked_at;
END;
$$;