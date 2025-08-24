import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NFTStats {
  [nftId: string]: {
    likes_count: number;
  };
}

export const useRealtimeNFTStats = (nftIds: string[] = []) => {
  const [nftStats, setNFTStats] = useState<NFTStats>({});
  const [loading, setLoading] = useState(true);

  const loadNFTStats = async () => {
    if (nftIds.length === 0) {
      setNFTStats({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load like counts for each NFT
      const statsPromises = nftIds.map(async (nftId) => {
        const { count } = await supabase
          .from('nft_likes')
          .select('*', { count: 'exact', head: true })
          .eq('nft_id', nftId);
        
        return {
          nftId,
          likes_count: count || 0
        };
      });

      const stats = await Promise.all(statsPromises);
      
      const statsMap = stats.reduce((acc, stat) => ({
        ...acc,
        [stat.nftId]: {
          likes_count: stat.likes_count
        }
      }), {});

      setNFTStats(statsMap);
    } catch (error) {
      console.error('Error loading NFT stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNFTStats();

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
      supabase.removeChannel(channel);
    };
  }, [nftIds.join(',')]);

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