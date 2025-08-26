-- Security Fix: Implement comprehensive security improvements

-- 1. Fix over-permissive RLS policies
-- Drop existing problematic policies for nfts table
DROP POLICY IF EXISTS "Allow wallet-based NFT minting" ON public.nfts;

-- Create secure NFT policies
CREATE POLICY "Owners and creators can view their NFTs" ON public.nfts
FOR SELECT USING (
  owner_address = (auth.jwt() ->> 'wallet_address') OR 
  creator_address = (auth.jwt() ->> 'wallet_address')
);

CREATE POLICY "Authenticated users can mint NFTs" ON public.nfts
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'wallet_address' IS NOT NULL AND
  (owner_address = (auth.jwt() ->> 'wallet_address') AND 
   creator_address = (auth.jwt() ->> 'wallet_address'))
);

-- 2. Add data integrity constraints
-- Add constraints to prevent empty wallet addresses
ALTER TABLE public.nfts 
ADD CONSTRAINT nfts_owner_address_not_empty CHECK (length(trim(owner_address)) > 0);

ALTER TABLE public.nfts 
ADD CONSTRAINT nfts_creator_address_not_empty CHECK (length(trim(creator_address)) > 0);

ALTER TABLE public.collections 
ADD CONSTRAINT collections_creator_address_not_empty CHECK (length(trim(creator_address)) > 0);

ALTER TABLE public.collections 
ADD CONSTRAINT collections_treasury_wallet_not_empty CHECK (length(trim(treasury_wallet)) > 0);

-- Add constraint to ensure mint prices are non-negative
ALTER TABLE public.collections 
ADD CONSTRAINT collections_mint_price_non_negative CHECK (mint_price >= 0);

ALTER TABLE public.nfts 
ADD CONSTRAINT nfts_price_non_negative CHECK (price IS NULL OR price >= 0);

-- 3. Fix collection policies - ensure creators can only manage their own collections
DROP POLICY IF EXISTS "Anyone can create collections" ON public.collections;

CREATE POLICY "Authenticated users can create collections" ON public.collections
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'wallet_address' IS NOT NULL AND
  creator_address = (auth.jwt() ->> 'wallet_address')
);

-- 4. Add audit trail for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_wallet TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can manage audit logs
CREATE POLICY "Service role can manage audit logs" ON public.security_audit_log
FOR ALL USING (auth.role() = 'service_role');

-- 5. Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations on user profiles, collections, and NFTs
  INSERT INTO public.security_audit_log (
    table_name, 
    operation, 
    user_wallet, 
    old_data, 
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(
      NEW.wallet_address, 
      NEW.creator_address, 
      NEW.owner_address,
      OLD.wallet_address, 
      OLD.creator_address, 
      OLD.owner_address
    ),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add audit triggers for sensitive tables
CREATE TRIGGER audit_user_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_collections_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER audit_nfts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.nfts
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- 7. Improve profile security
-- Add constraint to ensure wallet addresses are properly formatted (basic validation)
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_wallet_address_format CHECK (
  wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
);

-- 8. Add rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_wallet, endpoint, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- 9. Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_wallet TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  request_count INTEGER;
BEGIN
  -- Calculate current window (round down to the minute)
  current_window := date_trunc('minute', now()) - (extract(minute from now())::INTEGER % p_window_minutes) * interval '1 minute';
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (user_wallet, endpoint, window_start)
  VALUES (p_user_wallet, p_endpoint, current_window)
  ON CONFLICT (user_wallet, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    created_at = now();
  
  -- Check if limit exceeded
  SELECT request_count INTO request_count
  FROM public.rate_limits
  WHERE user_wallet = p_user_wallet 
    AND endpoint = p_endpoint 
    AND window_start = current_window;
  
  RETURN request_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add unique constraints to prevent duplicates
ALTER TABLE public.nfts 
ADD CONSTRAINT nfts_mint_address_unique UNIQUE (mint_address);

ALTER TABLE public.collections 
ADD CONSTRAINT collections_collection_mint_address_unique UNIQUE (collection_mint_address) 
WHERE collection_mint_address IS NOT NULL;

-- 11. Fix boosted_listings to ensure only owners can boost their NFTs
ALTER TABLE public.boosted_listings 
ADD CONSTRAINT boosted_listings_nft_owner_check CHECK (
  EXISTS (
    SELECT 1 FROM public.nfts n 
    WHERE n.id = nft_id AND n.owner_address = bidder_wallet
  )
);