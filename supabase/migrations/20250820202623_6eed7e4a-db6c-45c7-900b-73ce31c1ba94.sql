-- Fix critical security vulnerabilities in RLS policies - Part 2
-- Remove overly permissive policies that allow any authenticated user to access others' data

-- Collections table - Remove system override from user-facing policies
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;
DROP POLICY IF EXISTS "Anyone can create collections" ON public.collections;

CREATE POLICY "Users can manage their own collections" 
ON public.collections 
FOR ALL 
USING (creator_address = (auth.jwt() ->> 'wallet_address'::text))
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'::text));

CREATE POLICY "Anyone can create collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (creator_address = (auth.jwt() ->> 'wallet_address'::text));

-- NFTs table - Remove system override from user-facing policies
DROP POLICY IF EXISTS "Owners can manage their NFTs" ON public.nfts;

CREATE POLICY "Owners can manage their NFTs" 
ON public.nfts 
FOR ALL 
USING ((auth.jwt() ->> 'wallet_address'::text) = owner_address);

-- Mint jobs table - Remove system override from user-facing policies
DROP POLICY IF EXISTS "Users can only view their own mint jobs" ON public.mint_jobs;
DROP POLICY IF EXISTS "Users can create mint jobs" ON public.mint_jobs;
DROP POLICY IF EXISTS "System can update mint jobs" ON public.mint_jobs;

CREATE POLICY "Users can only view their own mint jobs" 
ON public.mint_jobs 
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

CREATE POLICY "Users can create mint jobs" 
ON public.mint_jobs 
FOR INSERT 
WITH CHECK (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

-- System operations for mint jobs (only for service role)
CREATE POLICY "Service role can update mint jobs" 
ON public.mint_jobs 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Collection whitelist - Remove system override from user-facing policies
DROP POLICY IF EXISTS "Creators can manage whitelist" ON public.collection_whitelist;
DROP POLICY IF EXISTS "Users can view their whitelist status" ON public.collection_whitelist;

CREATE POLICY "Creators can manage whitelist" 
ON public.collection_whitelist 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM collections c 
  WHERE c.id = collection_whitelist.collection_id 
  AND c.creator_address = (auth.jwt() ->> 'wallet_address'::text)
));

CREATE POLICY "Users can view their whitelist status" 
ON public.collection_whitelist 
FOR SELECT 
USING (wallet_address = (auth.jwt() ->> 'wallet_address'::text));

-- Marketplace activities - Restrict to system operations only for INSERT
DROP POLICY IF EXISTS "System can insert activities" ON public.marketplace_activities;

CREATE POLICY "Service role can insert activities" 
ON public.marketplace_activities 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Mint job items - Update existing policy to remove system override for user access
DROP POLICY IF EXISTS "Users can view their own job items" ON public.mint_job_items;
DROP POLICY IF EXISTS "System can manage job items" ON public.mint_job_items;

CREATE POLICY "Users can view their own job items" 
ON public.mint_job_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.mint_jobs mj 
    WHERE mj.id = mint_job_items.mint_job_id 
    AND mj.wallet_address = (auth.jwt() ->> 'wallet_address'::text)
  )
);

-- System operations for mint job items (only for service role)
CREATE POLICY "Service role can manage job items" 
ON public.mint_job_items 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add database trigger to handle items_redeemed counter server-side
CREATE OR REPLACE FUNCTION public.update_collection_supply()
RETURNS TRIGGER AS $$
BEGIN
  -- Update items_redeemed when a new NFT is minted
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections 
    SET items_redeemed = items_redeemed + 1,
        items_available = GREATEST(0, items_available - 1)
    WHERE id = NEW.collection_id;
    RETURN NEW;
  END IF;
  
  -- Handle NFT deletion (unlikely but for completeness)
  IF TG_OP = 'DELETE' THEN
    UPDATE public.collections 
    SET items_redeemed = GREATEST(0, items_redeemed - 1),
        items_available = items_available + 1
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic supply management
DROP TRIGGER IF EXISTS trigger_update_collection_supply ON public.nfts;
CREATE TRIGGER trigger_update_collection_supply
  AFTER INSERT OR DELETE ON public.nfts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collection_supply();