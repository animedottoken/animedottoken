import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LikeStats {
  nft_likes_count: number;
  collection_likes_count: number;
  total_likes_count: number;
}

export const useProfileLikeStats = (walletAddress: string | null) => {
  const [likeStats, setLikeStats] = useState<LikeStats>({
    nft_likes_count: 0,
    collection_likes_count: 0,
    total_likes_count: 0
  });
  const [loading, setLoading] = useState(true);

  const loadLikeStats = async () => {
    if (!walletAddress) {
      setLikeStats({
        nft_likes_count: 0,
        collection_likes_count: 0,
        total_likes_count: 0
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the RPC function to get like stats by wallet
      const { data, error } = await supabase.rpc('get_creator_like_stats_by_wallet', {
        p_wallet: walletAddress
      });

      if (error) {
        console.error('Error loading profile like stats:', error);
        setLikeStats({
          nft_likes_count: 0,
          collection_likes_count: 0,
          total_likes_count: 0
        });
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setLikeStats({
          nft_likes_count: Number(stats.nft_likes_count) || 0,
          collection_likes_count: Number(stats.collection_likes_count) || 0,
          total_likes_count: Number(stats.total_likes_count) || 0
        });
      } else {
        setLikeStats({
          nft_likes_count: 0,
          collection_likes_count: 0,
          total_likes_count: 0
        });
      }
    } catch (error) {
      console.error('Error loading profile like stats:', error);
      setLikeStats({
        nft_likes_count: 0,
        collection_likes_count: 0,
        total_likes_count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikeStats();
    
    // Set up real-time subscription for like changes
    const channel = supabase
      .channel('profile_like_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes'
        },
        () => {
          // Refresh stats when NFT likes change
          loadLikeStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_likes'
        },
        () => {
          // Refresh stats when collection likes change
          loadLikeStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress]);

  return {
    ...likeStats,
    loading,
    refreshStats: loadLikeStats
  };
};