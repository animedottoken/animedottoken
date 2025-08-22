-- Create INSERT policy for nfts to allow owners to insert their NFTs
CREATE POLICY "Users can insert their NFTs"
ON public.nfts
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'wallet_address'::text) = owner_address);

-- Ensure RLS remains enabled
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;