import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';

interface AnimeStake {
  id: string;
  staked_amount: number;
  staked_at: string;
  unlock_at?: string;
  is_active: boolean;
  last_reward_claim: string;
}

interface AnimeStakingReward {
  id: string;
  stake_id: string;
  reward_type: 'vault_access' | 'governance' | 'yield_share';
  reward_amount: number;
  reward_period_start: string;
  reward_period_end: string;
  claimed_at?: string;
}

export const useAnimeStaking = () => {
  const { user } = useAuth();
  const { publicKey, connected } = useSolanaWallet();
  const [userStakes, setUserStakes] = useState<AnimeStake[]>([]);
  const [userRewards, setUserRewards] = useState<AnimeStakingReward[]>([]);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [animeBalance, setAnimeBalance] = useState<number>(0);
  const [pendingRewards, setPendingRewards] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's ANIME token balance (mock implementation)
  const fetchAnimeBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setAnimeBalance(0);
      return;
    }

    try {
      // Mock ANIME balance - in production, this would query the Solana blockchain
      // For now, we'll simulate a balance between 500-5000 ANIME
      const mockBalance = Math.floor(Math.random() * 4500) + 500;
      setAnimeBalance(mockBalance);
    } catch (error) {
      console.error('Error fetching ANIME balance:', error);
      setAnimeBalance(0);
    }
  }, [publicKey, connected]);

  // Fetch user's staking data
  const fetchStakingData = useCallback(async () => {
    if (!user || !publicKey) {
      setUserStakes([]);
      setUserRewards([]);
      setTotalStaked(0);
      setPendingRewards(0);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch user stakes
      const { data: stakes, error: stakesError } = await supabase
        .from('anime_stakes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (stakesError) throw stakesError;

      setUserStakes(stakes || []);

      // Calculate total staked amount
      const total = stakes?.reduce((sum, stake) => sum + parseFloat(stake.staked_amount.toString()), 0) || 0;
      setTotalStaked(total);

      // Fetch user rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('anime_staking_rewards')
        .select('*')
        .eq('user_id', user.id);

      if (rewardsError) throw rewardsError;

      setUserRewards(rewards || []);

      // Calculate pending rewards
      const pending = rewards
        ?.filter(reward => !reward.claimed_at)
        ?.reduce((sum, reward) => sum + parseFloat(reward.reward_amount.toString()), 0) || 0;
      
      setPendingRewards(pending);

    } catch (error) {
      console.error('Error fetching staking data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, publicKey]);

  // Stake tokens function
  const stakeTokens = useCallback(async (amount: number) => {
    if (!user || !publicKey || !connected) {
      throw new Error('User must be authenticated and wallet connected');
    }

    if (amount <= 0) {
      throw new Error('Stake amount must be greater than 0');
    }

    if (amount > animeBalance) {
      throw new Error('Insufficient ANIME balance');
    }

    try {
      setIsLoading(true);

      // Call edge function to handle staking
      const { data, error } = await supabase.functions.invoke('stake-anime', {
        body: {
          wallet_address: publicKey,
          amount: amount
        }
      });

      if (error) throw error;

      // Refresh data after successful stake
      await fetchStakingData();
      await fetchAnimeBalance();

      return data;
    } catch (error: any) {
      console.error('Staking error:', error);
      throw new Error(error.message || 'Failed to stake tokens');
    } finally {
      setIsLoading(false);
    }
  }, [user, publicKey, connected, animeBalance, fetchStakingData, fetchAnimeBalance]);

  // Unstake tokens function
  const unstakeTokens = useCallback(async (amount: number) => {
    if (!user || !publicKey || !connected) {
      throw new Error('User must be authenticated and wallet connected');
    }

    if (amount <= 0) {
      throw new Error('Unstake amount must be greater than 0');
    }

    if (amount > totalStaked) {
      throw new Error('Insufficient staked amount');
    }

    try {
      setIsLoading(true);

      // Call edge function to handle unstaking
      const { data, error } = await supabase.functions.invoke('unstake-anime', {
        body: {
          wallet_address: publicKey,
          amount: amount
        }
      });

      if (error) throw error;

      // Refresh data after successful unstake
      await fetchStakingData();
      await fetchAnimeBalance();

      return data;
    } catch (error: any) {
      console.error('Unstaking error:', error);
      throw new Error(error.message || 'Failed to unstake tokens');
    } finally {
      setIsLoading(false);
    }
  }, [user, publicKey, connected, totalStaked, fetchStakingData, fetchAnimeBalance]);

  // Claim rewards function
  const claimRewards = useCallback(async () => {
    if (!user || !publicKey || !connected) {
      throw new Error('User must be authenticated and wallet connected');
    }

    if (pendingRewards <= 0) {
      throw new Error('No pending rewards to claim');
    }

    try {
      setIsLoading(true);

      // Call edge function to handle reward claiming
      const { data, error } = await supabase.functions.invoke('claim-staking-rewards', {
        body: {
          wallet_address: publicKey
        }
      });

      if (error) throw error;

      // Refresh data after successful claim
      await fetchStakingData();
      await fetchAnimeBalance();

      return data;
    } catch (error: any) {
      console.error('Claim rewards error:', error);
      throw new Error(error.message || 'Failed to claim rewards');
    } finally {
      setIsLoading(false);
    }
  }, [user, publicKey, connected, pendingRewards, fetchStakingData, fetchAnimeBalance]);

  // Check vault access
  const checkVaultAccess = useCallback(async (minimumStake: number = 1000) => {
    if (!publicKey) return false;

    try {
      const { data, error } = await supabase.rpc('check_vault_access', {
        p_wallet_address: publicKey,
        p_minimum_stake: minimumStake
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking vault access:', error);
      return false;
    }
  }, [publicKey]);

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchStakingData(),
      fetchAnimeBalance()
    ]);
  }, [fetchStakingData, fetchAnimeBalance]);

  // Initial data fetch
  useEffect(() => {
    if (user && publicKey && connected) {
      refetch();
    }
  }, [user, publicKey, connected, refetch]);

  // Set up real-time subscriptions for staking data
  useEffect(() => {
    if (!user) return;

    const stakesSubscription = supabase
      .channel('anime-stakes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anime_stakes',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Stakes data changed, refetching...');
          fetchStakingData();
        }
      )
      .subscribe();

    const rewardsSubscription = supabase
      .channel('anime-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anime_staking_rewards',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Rewards data changed, refetching...');
          fetchStakingData();
        }
      )
      .subscribe();

    return () => {
      stakesSubscription.unsubscribe();
      rewardsSubscription.unsubscribe();
    };
  }, [user, fetchStakingData]);

  return {
    userStakes,
    userRewards,
    totalStaked,
    animeBalance,
    pendingRewards,
    isLoading,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    checkVaultAccess,
    refetch
  };
};