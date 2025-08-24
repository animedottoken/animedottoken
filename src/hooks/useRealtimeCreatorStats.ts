import { useState, useEffect, useCallback, useRef } from 'react';
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
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced refresh to prevent rapid successive updates
  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadCreatorStats();
    }, 250);
  }, []);

  const loadCreatorStats = useCallback(async () => {
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
  }, [walletAddresses.join(',')]);

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
        }
      }));
      // Also trigger a debounced refresh to sync with database
      debouncedRefresh();
    }
  }, [walletAddresses, debouncedRefresh]);

  useEffect(() => {
    loadCreatorStats();

    // Listen for cross-page creator stats updates
    const handleStatsUpdate = (event: CustomEvent) => handleCreatorStatsUpdate(event);
    window.addEventListener('creator-stats-update', handleStatsUpdate as EventListener);

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
        async (payload) => {
          console.log('NFT likes change detected in creator stats:', payload);
          // For NFT likes, we need to check if the NFT belongs to one of our tracked creators
          try {
            const nftId = (payload.new as any)?.nft_id || (payload.old as any)?.nft_id;
            if (nftId) {
              const { data: nftData } = await supabase
                .from('nfts')
                .select('creator_address')
                .eq('id', nftId)
                .single();
              
              if (nftData && walletAddresses.includes(nftData.creator_address)) {
                debouncedRefresh();
              }
            }
          } catch (error) {
            console.error('Error checking NFT creator for stats update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('creator-stats-update', handleStatsUpdate as EventListener);
      supabase.removeChannel(channel);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [walletAddresses.join(','), loadCreatorStats, handleCreatorStatsUpdate, debouncedRefresh]);

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