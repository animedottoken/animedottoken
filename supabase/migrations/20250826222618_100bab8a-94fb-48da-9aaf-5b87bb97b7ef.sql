-- Security Fix: Implement comprehensive security improvements (Final)

-- 1. Fix over-permissive RLS policies (with proper checks)
DROP POLICY IF EXISTS "Allow wallet-based NFT minting" ON public.nfts;
DROP POLICY IF EXISTS "Owners and creators can view their NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Authenticated users can mint NFTs" ON public.nfts;

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

-- 2. Add data integrity constraints (with IF NOT EXISTS where possible)
DO $$
BEGIN
  -- Add constraints with error handling
  BEGIN
    ALTER TABLE public.nfts 
    ADD CONSTRAINT nfts_owner_address_not_empty CHECK (length(trim(owner_address)) > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Constraint already exists
  END;
  
  BEGIN
    ALTER TABLE public.nfts 
    ADD CONSTRAINT nfts_creator_address_not_empty CHECK (length(trim(creator_address)) > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.collections 
    ADD CONSTRAINT collections_creator_address_not_empty CHECK (length(trim(creator_address)) > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.collections 
    ADD CONSTRAINT collections_treasury_wallet_not_empty CHECK (length(trim(treasury_wallet)) > 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.collections 
    ADD CONSTRAINT collections_mint_price_non_negative CHECK (mint_price >= 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TABLE public.nfts 
    ADD CONSTRAINT nfts_price_non_negative CHECK (price IS NULL OR price >= 0);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 3. Fix collection policies
DROP POLICY IF EXISTS "Anyone can create collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can create collections" ON public.collections;

CREATE POLICY "Authenticated users can create collections" ON public.collections
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'wallet_address' IS NOT NULL AND
  creator_address = (auth.jwt() ->> 'wallet_address')
);

-- 4. Create audit system
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_wallet TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.security_audit_log;
CREATE POLICY "Service role can manage audit logs" ON public.security_audit_log
FOR ALL USING (auth.role() = 'service_role');

-- 5. Create rate limiting system
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_wallet, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
FOR ALL USING (auth.role() = 'service_role');

-- 6. Add unique indexes for data integrity
CREATE UNIQUE INDEX IF NOT EXISTS nfts_mint_address_unique_idx ON public.nfts (mint_address);
CREATE UNIQUE INDEX IF NOT EXISTS collections_collection_mint_address_unique_idx 
ON public.collections (collection_mint_address) 
WHERE collection_mint_address IS NOT NULL;