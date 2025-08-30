-- Fix search_path security issue for user wallet functions
DROP FUNCTION IF EXISTS public.get_user_primary_wallet(UUID);
DROP FUNCTION IF EXISTS public.get_user_wallets(UUID);

-- Recreate function to get user's primary wallet with proper search_path
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

-- Recreate function to get all user wallets with proper search_path
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