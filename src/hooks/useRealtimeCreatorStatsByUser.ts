import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorStats {
  [userId: string]: {
    follower_count: number;
    following_count: number;
    nft_likes_count: number;
    collection_likes_count: number;
    total_likes_count: number;
  };
}

export const useRealtimeCreatorStatsByUser = (userIds: string[] = []) => {
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({});
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();
  const loadingRef = useRef(false);
  const userIdsKey = useMemo(() => userIds.sort().join(','), [userIds]);
  
  const loadCreatorStats = useCallback(async () => {
    if (userIds.length === 0 || loadingRef.current) {
      if (userIds.length === 0) {
        setCreatorStats({});
        setLoading(false);
      }
      return;
    }

    // Prevent concurrent calls
    loadingRef.current = true;

    try {
      setLoading(true);
      
      // Use edge function to bypass RLS issues
      const { data: response, error } = await supabase.functions.invoke('get-creator-stats-by-user', {
        body: { user_ids: userIds }
      });

      if (error) throw error;

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to fetch creator stats');
      }

      // Create stats map from response
      const statsMap = (response.stats || []).reduce((acc: any, stat: any) => ({
        ...acc,
        [stat.user_id]: {
          follower_count: stat.follower_count || 0,
          following_count: stat.following_count || 0,
          nft_likes_count: stat.nft_likes_count || 0,
          collection_likes_count: stat.collection_likes_count || 0,
          total_likes_count: stat.total_likes_count || 0
        }
      }), {});

      setCreatorStats(statsMap);
    } catch (error) {
      console.error('Error loading creator stats by user:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [userIdsKey]);

  // Debounced refresh to prevent rapid successive updates - also check if already loading
  const debouncedRefresh = useCallback(() => {
    if (loadingRef.current) return; // Skip if already loading
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (!loadingRef.current) { // Double-check before executing
        loadCreatorStats();
      }
    }, 200); // Increased debounce time for better performance
  }, [loadCreatorStats]);

  // Optimistically update creator stats from cross-page signals
  const handleCreatorStatsUpdate = useCallback((event: CustomEvent) => {
    const { userId, type, delta } = event.detail;
    if (userIds.includes(userId)) {
      setCreatorStats(prev => {
        const currentStats = prev[userId] || {
          follower_count: 0,
          following_count: 0,
          nft_likes_count: 0,
          collection_likes_count: 0,
          total_likes_count: 0
        };
        
        // Calculate new individual counts
        const newNftLikesCount = type === 'nft_like' 
          ? Math.max(0, currentStats.nft_likes_count + delta)
          : currentStats.nft_likes_count;
          
        const newCollectionLikesCount = type === 'collection_like' 
          ? Math.max(0, currentStats.collection_likes_count + delta)
          : currentStats.collection_likes_count;
        
        return {
          ...prev,
          [userId]: {
            follower_count: type === 'follower' 
              ? Math.max(0, currentStats.follower_count + delta)
              : currentStats.follower_count,
            following_count: type === 'following' 
              ? Math.max(0, currentStats.following_count + delta)
              : currentStats.following_count,
            nft_likes_count: newNftLikesCount,
            collection_likes_count: newCollectionLikesCount,
            total_likes_count: newNftLikesCount + newCollectionLikesCount,
          }
        };
      });
    }
  }, [userIdsKey]);

  useEffect(() => {
    loadCreatorStats();

    // Listen for cross-page creator stats updates
    const handleStatsUpdate = (event: CustomEvent) => handleCreatorStatsUpdate(event);
    window.addEventListener('creator-stats-update-by-user', handleStatsUpdate as EventListener);

    // Refresh on tab visibility change to sync with database
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up filtered real-time subscription for creator stats changes
    const channel = supabase
      .channel('creator_stats_realtime_by_user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows'
        },
        (payload) => {
          console.log('Creator follows change detected in stats (by user):', payload);
          // Only refresh if the change affects our tracked users (either follower or creator)
          const newRecord = (payload.new as any) || {};
          const oldRecord = (payload.old as any) || {};
          const affectedIds = [newRecord.follower_user_id, newRecord.creator_user_id, oldRecord.follower_user_id, oldRecord.creator_user_id].filter(Boolean);
          if (affectedIds.some((id: string) => userIds.includes(id))) {
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
          console.log('NFT likes change detected in creator stats (by user):', payload);
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
          console.log('Collection likes change detected in creator stats (by user):', payload);
          // For performance, just refresh without checking - the stats view will handle filtering
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('creator-stats-update-by-user', handleStatsUpdate as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [userIdsKey, loadCreatorStats, handleCreatorStatsUpdate, debouncedRefresh]);

  const getCreatorFollowerCount = (userId: string): number => {
    return creatorStats[userId]?.follower_count || 0;
  };

  const getCreatorFollowingCount = (userId: string): number => {
    return creatorStats[userId]?.following_count || 0;
  };

  const getCreatorNFTLikeCount = (userId: string): number => {
    return creatorStats[userId]?.nft_likes_count || 0;
  };

  const getCreatorTotalLikeCount = (userId: string): number => {
    return creatorStats[userId]?.total_likes_count || 0;
  };

  return {
    creatorStats,
    loading,
    getCreatorFollowerCount,
    getCreatorFollowingCount,
    getCreatorNFTLikeCount,
    getCreatorTotalLikeCount,
    refreshStats: loadCreatorStats
  };
};