
-- RLS: allow authenticated users to view NFTs they created via auth (email) user id
CREATE POLICY "Creators (auth uid) can view their NFTs"
  ON public.nfts
  FOR SELECT
  USING (creator_user_id = auth.uid());

-- RLS: allow authenticated users to view NFTs that involve their linked wallets
CREATE POLICY "Users can view NFTs via linked wallets"
  ON public.nfts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_wallets uw
      WHERE uw.user_id = auth.uid()
        AND uw.is_verified = true
        AND (
          uw.wallet_address = public.nfts.owner_address
          OR uw.wallet_address = public.nfts.creator_address
        )
    )
  );

-- RLS: allow authenticated users to view collections they created via auth (email) user id
CREATE POLICY "Creators (auth uid) can view their collections"
  ON public.collections
  FOR SELECT
  USING (creator_user_id = auth.uid());

-- RLS: allow authenticated users to view collections that involve their linked wallets
CREATE POLICY "Users can view collections via linked wallets"
  ON public.collections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_wallets uw
      WHERE uw.user_id = auth.uid()
        AND uw.is_verified = true
        AND (
          uw.wallet_address = public.collections.creator_address
          OR uw.wallet_address = public.collections.treasury_wallet
        )
    )
  );
