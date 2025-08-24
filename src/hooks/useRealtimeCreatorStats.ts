import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorStats {
  [walletAddress: string]: {
    follower_count: number;
    nft_likes_count: number;
  };
}

export const useRealtimeCreatorStats = (walletAddresses: string[] = []) => {
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({});
  const [loading, setLoading] = useState(true);

  const loadCreatorStats = async () => {
    if (walletAddresses.length === 0) {
      setCreatorStats({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load stats from the creators_public_stats view
      const { data: statsData, error } = await supabase
        .from('creators_public_stats')
        .select('wallet_address, follower_count, nft_likes_count')
        .in('wallet_address', walletAddresses);

      if (error) throw error;

      const statsMap = (statsData || []).reduce((acc, stat) => ({
        ...acc,
        [stat.wallet_address]: {
          follower_count: stat.follower_count || 0,
          nft_likes_count: stat.nft_likes_count || 0
        }
      }), {});

      setCreatorStats(statsMap);
    } catch (error) {
      console.error('Error loading creator stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorStats();

    // Set up real-time subscription for creator stats changes
    const channel = supabase
      .channel('creator_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows'
        },
        (payload) => {
          console.log('Creator follows change detected in stats:', payload);
          // Refresh stats when any creator follow changes
          loadCreatorStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes'
        },
        (payload) => {
          console.log('NFT likes change detected in creator stats:', payload);
          // Refresh stats when any NFT like changes (affects nft_likes_count)
          loadCreatorStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddresses.join(',')]);

  const getCreatorFollowerCount = (walletAddress: string): number => {
    return creatorStats[walletAddress]?.follower_count || 0;
  };

  const getCreatorNFTLikeCount = (walletAddress: string): number => {
    return creatorStats[walletAddress]?.nft_likes_count || 0;
  };

  return {
    creatorStats,
    loading,
    getCreatorFollowerCount,
    getCreatorNFTLikeCount,
    refreshStats: loadCreatorStats
  };
};