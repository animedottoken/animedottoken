-- Add gamification fields to existing user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trade_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_rank TEXT DEFAULT 'DEFAULT' CHECK (profile_rank IN ('DEFAULT', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND')),
ADD COLUMN IF NOT EXISTS pfp_unlock_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_pfp_nft_mint_address TEXT;

-- Create index for faster nickname lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON public.user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON public.user_profiles(wallet_address);

-- Function to calculate profile rank based on trade count
CREATE OR REPLACE FUNCTION public.calculate_profile_rank(trade_count INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF trade_count >= 1000 THEN
    RETURN 'DIAMOND';
  ELSIF trade_count >= 250 THEN
    RETURN 'GOLD';
  ELSIF trade_count >= 50 THEN
    RETURN 'SILVER';
  ELSIF trade_count >= 10 THEN
    RETURN 'BRONZE';
  ELSE
    RETURN 'DEFAULT';
  END IF;
END;
$$;

-- Function to update profile rank automatically when trade_count changes
CREATE OR REPLACE FUNCTION public.update_profile_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.profile_rank := public.calculate_profile_rank(NEW.trade_count);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update rank when trade_count changes
DROP TRIGGER IF EXISTS trigger_update_profile_rank ON public.user_profiles;
CREATE TRIGGER trigger_update_profile_rank
  BEFORE UPDATE OF trade_count ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rank();

-- Function to increment trade count for user
CREATE OR REPLACE FUNCTION public.increment_user_trade_count(user_wallet_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (wallet_address, trade_count)
  VALUES (user_wallet_address, 1)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    trade_count = user_profiles.trade_count + 1,
    updated_at = now();
END;
$$;