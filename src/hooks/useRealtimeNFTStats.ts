import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NFTStats {
  [nftId: string]: {
    likes_count: number;
  };
}

export const useRealtimeNFTStats = (nftIds: string[] = []) => {
  const [nftStats, setNFTStats] = useState<NFTStats>({});
  const [loading, setLoading] = useState(true);

  // Optimistically update NFT stats from cross-page signals
  const handleNFTStatsUpdate = useCallback((event: CustomEvent) => {
    const { nftId, delta } = event.detail;
    if (nftIds.includes(nftId)) {
      setNFTStats(prev => ({
        ...prev,
        [nftId]: {
          likes_count: Math.max(0, (prev[nftId]?.likes_count || 0) + delta)
        }
      }));
    }
  }, [nftIds]);

  const loadNFTStats = async () => {
    if (nftIds.length === 0) {
      setNFTStats({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use RLS-safe RPC function to get like counts
      const { data: likeCounts, error } = await supabase.rpc('get_nft_like_counts_public');
      
      if (error) {
        console.error('Error loading NFT like counts:', error);
        setNFTStats({});
        return;
      }

      // Create stats map for requested NFT IDs
      const statsMap = nftIds.reduce((acc, nftId) => {
        const likeData = (likeCounts || []).find((item: any) => item.nft_id === nftId);
        acc[nftId] = {
          likes_count: likeData ? Number(likeData.like_count) : 0
        };
        return acc;
      }, {} as NFTStats);

      setNFTStats(statsMap);
    } catch (error) {
      console.error('Error loading NFT stats:', error);
      setNFTStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNFTStats();

    // Listen for cross-page NFT stats updates
    const handleStatsUpdate = (event: CustomEvent) => handleNFTStatsUpdate(event);
    window.addEventListener('nft-stats-update', handleStatsUpdate as EventListener);

    // Set up real-time subscription for NFT likes
    const channel = supabase
      .channel('nft_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes'
        },
        (payload) => {
          console.log('NFT likes change detected in stats:', payload);
          // Refresh stats when any NFT like changes
          loadNFTStats();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('nft-stats-update', handleStatsUpdate as EventListener);
      supabase.removeChannel(channel);
    };
  }, [nftIds.join(','), handleNFTStatsUpdate]);

  const getNFTLikeCount = (nftId: string): number => {
    return nftStats[nftId]?.likes_count || 0;
  };

  return {
    nftStats,
    loading,
    getNFTLikeCount,
    refreshStats: loadNFTStats
  };
};