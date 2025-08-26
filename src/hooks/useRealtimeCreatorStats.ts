import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorStats {
  [walletAddress: string]: {
    follower_count: number;
    nft_likes_count: number;
    collection_likes_count: number;
    total_likes_count: number;
  };
}

export const useRealtimeCreatorStats = (walletAddresses: string[] = []) => {
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({});
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();
  const addressesKey = walletAddresses.sort().join(',');
  
  const loadCreatorStats = useCallback(async () => {
    if (walletAddresses.length === 0) {
      setCreatorStats({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load stats using the secure RPC function
      const { data: statsData, error } = await supabase.rpc('get_creators_public_stats');

      if (error) throw error;

      // Filter by requested wallet addresses and create map
      const filteredStats = (statsData || []).filter(stat => 
        walletAddresses.includes(stat.wallet_address)
      );
      
      const statsMap = filteredStats.reduce((acc, stat) => ({
        ...acc,
        [stat.wallet_address]: {
          follower_count: stat.follower_count || 0,
          nft_likes_count: stat.nft_likes_count || 0,
          collection_likes_count: stat.collection_likes_count || 0,
          total_likes_count: stat.total_likes_count || 0
        }
      }), {});

      setCreatorStats(statsMap);
    } catch (error) {
      console.error('Error loading creator stats:', error);
    } finally {
      setLoading(false);
    }
  }, [addressesKey]);

  // Debounced refresh to prevent rapid successive updates
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadCreatorStats();
    }, 100);
  }, [loadCreatorStats]);

  // Optimistically update creator stats from cross-page signals
  const handleCreatorStatsUpdate = useCallback((event: CustomEvent) => {
    const { wallet, type, delta } = event.detail;
    if (walletAddresses.includes(wallet)) {
      setCreatorStats(prev => ({
        ...prev,
        [wallet]: {
          follower_count: type === 'follow' 
            ? Math.max(0, (prev[wallet]?.follower_count || 0) + delta)
            : (prev[wallet]?.follower_count || 0),
          nft_likes_count: type === 'nft_like' 
            ? Math.max(0, (prev[wallet]?.nft_likes_count || 0) + delta)
            : (prev[wallet]?.nft_likes_count || 0),
          collection_likes_count: type === 'collection_like' 
            ? Math.max(0, (prev[wallet]?.collection_likes_count || 0) + delta)
            : (prev[wallet]?.collection_likes_count || 0),
          total_likes_count: Math.max(0, 
            (type === 'nft_like' ? (prev[wallet]?.nft_likes_count || 0) + delta : (prev[wallet]?.nft_likes_count || 0)) +
            (type === 'collection_like' ? (prev[wallet]?.collection_likes_count || 0) + delta : (prev[wallet]?.collection_likes_count || 0))
          ),
        }
      }));
      // Let realtime subscriptions handle authoritative updates - no immediate refresh
    }
  }, [addressesKey]);

  useEffect(() => {
    loadCreatorStats();

    // Listen for cross-page creator stats updates
    const handleStatsUpdate = (event: CustomEvent) => handleCreatorStatsUpdate(event);
    window.addEventListener('creator-stats-update', handleStatsUpdate as EventListener);

    // Refresh on tab visibility change to sync with database
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up filtered real-time subscription for creator stats changes
    const channel = supabase
      .channel('creator_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows',
          filter: walletAddresses.length > 0 
            ? `creator_wallet=in.(${walletAddresses.join(',')})`
            : undefined
        },
        (payload) => {
          console.log('Creator follows change detected in stats:', payload);
          // Only refresh if the change affects our tracked creators
          const affectedWallet = (payload.new as any)?.creator_wallet || (payload.old as any)?.creator_wallet;
          if (walletAddresses.includes(affectedWallet)) {
            debouncedRefresh();
          }
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
          // For performance, just refresh without checking - the stats view will handle filtering
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_likes'
        },
        (payload) => {
          console.log('Collection likes change detected in creator stats:', payload);
          // For performance, just refresh without checking - the stats view will handle filtering
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('creator-stats-update', handleStatsUpdate as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [addressesKey, loadCreatorStats, handleCreatorStatsUpdate, debouncedRefresh]);

  const getCreatorFollowerCount = (walletAddress: string): number => {
    return creatorStats[walletAddress]?.follower_count || 0;
  };

  const getCreatorNFTLikeCount = (walletAddress: string): number => {
    return creatorStats[walletAddress]?.nft_likes_count || 0;
  };

  const getCreatorTotalLikeCount = (walletAddress: string): number => {
    return creatorStats[walletAddress]?.total_likes_count || 0;
  };

  return {
    creatorStats,
    loading,
    getCreatorFollowerCount,
    getCreatorNFTLikeCount,
    getCreatorTotalLikeCount,
    refreshStats: loadCreatorStats
  };
};