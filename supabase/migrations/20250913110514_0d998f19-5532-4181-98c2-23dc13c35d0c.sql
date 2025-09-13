-- Core ANIME Staking Database Schema

-- Create enum for reward types
CREATE TYPE public.anime_reward_type AS ENUM ('vault_access', 'governance', 'yield_share');

-- Create anime_stakes table
CREATE TABLE public.anime_stakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  staked_amount NUMERIC NOT NULL DEFAULT 0,
  staked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unlock_at TIMESTAMP WITH TIME ZONE,  -- NULL means no lock period
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_reward_claim TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT anime_stakes_amount_positive CHECK (staked_amount >= 0)
);

-- Create anime_staking_rewards table
CREATE TABLE public.anime_staking_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stake_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reward_type anime_reward_type NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  reward_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT anime_rewards_amount_positive CHECK (reward_amount >= 0),
  CONSTRAINT anime_rewards_period_valid CHECK (reward_period_end > reward_period_start)
);

-- Add foreign key relationships
ALTER TABLE public.anime_staking_rewards 
ADD CONSTRAINT anime_staking_rewards_stake_id_fkey 
FOREIGN KEY (stake_id) REFERENCES public.anime_stakes(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_anime_stakes_user_id ON public.anime_stakes(user_id);
CREATE INDEX idx_anime_stakes_wallet_address ON public.anime_stakes(wallet_address);
CREATE INDEX idx_anime_stakes_active ON public.anime_stakes(is_active) WHERE is_active = true;
CREATE INDEX idx_anime_rewards_stake_id ON public.anime_staking_rewards(stake_id);
CREATE INDEX idx_anime_rewards_user_id ON public.anime_staking_rewards(user_id);
CREATE INDEX idx_anime_rewards_unclaimed ON public.anime_staking_rewards(claimed_at) WHERE claimed_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.anime_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_staking_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anime_stakes
CREATE POLICY "Users can view their own stakes" 
ON public.anime_stakes 
FOR SELECT 
USING (user_id = auth.uid() OR wallet_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "Users can create their own stakes" 
ON public.anime_stakes 
FOR INSERT 
WITH CHECK (user_id = auth.uid() AND wallet_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "Users can update their own stakes" 
ON public.anime_stakes 
FOR UPDATE 
USING (user_id = auth.uid() OR wallet_address = (auth.jwt() ->> 'wallet_address'))
WITH CHECK (user_id = auth.uid() AND wallet_address = (auth.jwt() ->> 'wallet_address'));

CREATE POLICY "Service role can manage all stakes" 
ON public.anime_stakes 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for anime_staking_rewards
CREATE POLICY "Users can view their own rewards" 
ON public.anime_staking_rewards 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all rewards" 
ON public.anime_staking_rewards 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Users can claim their own rewards" 
ON public.anime_staking_rewards 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Database Functions

-- Function to get total staked ANIME for a user
CREATE OR REPLACE FUNCTION public.get_user_total_staked(p_wallet_address TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_staked NUMERIC;
BEGIN
  SELECT COALESCE(SUM(staked_amount), 0) INTO total_staked
  FROM public.anime_stakes
  WHERE wallet_address = p_wallet_address 
    AND is_active = true
    AND (unlock_at IS NULL OR unlock_at > now());
  
  RETURN total_staked;
END;
$$;

-- Function to check if user meets minimum staking requirements for vault access
CREATE OR REPLACE FUNCTION public.check_vault_access(p_wallet_address TEXT, p_minimum_stake NUMERIC DEFAULT 1000)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_user_total_staked(p_wallet_address) >= p_minimum_stake;
END;
$$;

-- Function to calculate pending staking rewards
CREATE OR REPLACE FUNCTION public.calculate_pending_rewards(p_stake_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stake_amount NUMERIC;
  time_since_last_claim INTERVAL;
  daily_reward_rate NUMERIC := 0.001; -- 0.1% daily reward rate (adjustable)
  pending_rewards NUMERIC;
BEGIN
  SELECT 
    staked_amount,
    now() - GREATEST(last_reward_claim, staked_at)
  INTO stake_amount, time_since_last_claim
  FROM public.anime_stakes
  WHERE id = p_stake_id AND is_active = true;
  
  IF stake_amount IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate rewards based on time staked and amount
  pending_rewards := stake_amount * daily_reward_rate * EXTRACT(EPOCH FROM time_since_last_claim) / 86400;
  
  RETURN GREATEST(pending_rewards, 0);
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_anime_stakes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_anime_stakes_updated_at
  BEFORE UPDATE ON public.anime_stakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_anime_stakes_updated_at();

-- Function to handle unstaking (sets is_active to false instead of deleting)
CREATE OR REPLACE FUNCTION public.unstake_anime(p_stake_id UUID, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stake RECORD;
  remaining_amount NUMERIC;
BEGIN
  -- Get current stake info
  SELECT * INTO current_stake
  FROM public.anime_stakes
  WHERE id = p_stake_id 
    AND user_id = auth.uid()
    AND is_active = true
    AND (unlock_at IS NULL OR unlock_at <= now());
  
  IF current_stake IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stake not found or still locked');
  END IF;
  
  IF p_amount > current_stake.staked_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient staked amount');
  END IF;
  
  remaining_amount := current_stake.staked_amount - p_amount;
  
  IF remaining_amount = 0 THEN
    -- Full unstake - deactivate the stake
    UPDATE public.anime_stakes
    SET is_active = false, updated_at = now()
    WHERE id = p_stake_id;
  ELSE
    -- Partial unstake - reduce the amount
    UPDATE public.anime_stakes
    SET staked_amount = remaining_amount, updated_at = now()
    WHERE id = p_stake_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'unstaked_amount', p_amount,
    'remaining_staked', remaining_amount
  );
END;
$$;