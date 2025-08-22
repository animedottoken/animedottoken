-- Add explicit INSERT policy for nfts to satisfy RLS on inserts
CREATE POLICY IF NOT EXISTS "Owners can insert their NFTs"
ON public.nfts
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'wallet_address'::text) = owner_address);

-- Optional: ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;