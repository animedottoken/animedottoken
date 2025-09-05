import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNFTLikes = () => {
  const [likedNFTs, setLikedNFTs] = useState<string[]>([]);
  const [optimisticLikes, setOptimisticLikes] = useState<Set<string>>(new Set());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const watchdogTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const loadLikedNFTs = useCallback(async () => {
    if (!user) {
      setLikedNFTs([]);
      setOptimisticLikes(new Set());
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-liked-nfts');

      if (error || !data?.success) {
        console.warn('Edge function failed, falling back to direct query:', error);
        // Fallback to direct database query with RLS
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('nft_likes')
          .select('nft_id')
          .eq('user_id', user.id);
        
        if (!fallbackError && fallbackData) {
          setLikedNFTs(fallbackData.map(l => l.nft_id));
        }
        return;
      }
      
      if (data?.liked_nft_ids) {
        setLikedNFTs(data.liked_nft_ids);
      }
    } catch (err) {
      console.error('Error loading liked NFTs:', err);
      // Keep existing state on error instead of wiping it
    }
  }, [user]);

  const toggleLike = useCallback(async (nftId: string, creatorAddress?: string) => {
    if (!user) {
      return false;
    }

    // Accept any nftId format; backend will validate permissions and existence

    // Clear any existing debounce timer for this specific NFT
    if (debounceTimers.current.has(nftId)) {
      clearTimeout(debounceTimers.current.get(nftId)!);
      debounceTimers.current.delete(nftId);
    }

    const wasLiked = likedNFTs.includes(nftId) || optimisticLikes.has(nftId);
    const action = wasLiked ? 'unlike' : 'like';

    // Optimistic UI update
    setOptimisticLikes(prev => {
      const newSet = new Set(prev);
      if (action === 'like') {
        newSet.add(nftId);
      } else {
        newSet.delete(nftId);
      }
      return newSet;
    });

    // Set pending state for this specific NFT
    setPendingLikes(prev => new Set(prev).add(nftId));

    // Start watchdog timer to clear stuck pending state
    if (watchdogTimers.current.has(nftId)) {
      clearTimeout(watchdogTimers.current.get(nftId)!);
      watchdogTimers.current.delete(nftId);
    }
    const watchdogId = setTimeout(() => {
      if (pendingLikes.has(nftId)) {
        console.warn('Watchdog clearing stuck pending like for NFT:', nftId);
        setPendingLikes(prev => { const ns = new Set(prev); ns.delete(nftId); return ns; });
        // Revert optimistic change since backend didn't confirm in time
        setOptimisticLikes(prev => {
          const ns = new Set(prev);
          if (action === 'like') { ns.delete(nftId); } else { ns.add(nftId); }
          return ns;
        });
        toast.warning('Network is slow. Please try liking again.');
      }
      watchdogTimers.current.delete(nftId);
    }, 4000);
    watchdogTimers.current.set(nftId, watchdogId);

    // Dispatch optimistic update signals for stats
    const nftDelta = wasLiked ? -1 : 1;
    window.dispatchEvent(new CustomEvent('nft-stats-update', {
      detail: { nftId, delta: nftDelta }
    }));
    
    // Try to get creator user_id for stats update
    const getCreatorUserId = async () => {
      try {
        const { data: nftData } = await supabase
          .from('nfts')
          .select('creator_user_id')
          .eq('id', nftId)
          .maybeSingle();
        
        if (nftData?.creator_user_id) {
          // Dispatch creator stats update with proper user_id
          window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
            detail: { userId: nftData.creator_user_id, type: 'nft_like', delta: nftDelta }
          }));
          console.log('Updated creator NFT like stats for user:', nftData.creator_user_id);
        }
      } catch (error) {
        console.error('Error getting creator user_id for stats update:', error);
      }
    };
    
    // Run async to not block the main like operation
    getCreatorUserId();

    return new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(async () => {
        // Remove this timer from our map
        debounceTimers.current.delete(nftId);
        try {
          const { data, error } = await supabase.functions.invoke('like-nft', {
            body: { 
              nft_id: nftId,
              action
            },
          });

          if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Network error');
          }
          
          if (!data?.success) {
            const errorCode = data?.code || 'LKN500';
            const friendlyMessage = data?.message || 'Failed to update like status';
            
            // Show friendly error message with error code
            toast.error(`${friendlyMessage} (Error: ${errorCode})`, {
              description: 'You can report this error code to our support team.'
            });
            throw new Error(friendlyMessage);
          }
          
          // Update actual state
          if (action === 'like') {
            setLikedNFTs(prev => prev.includes(nftId) ? prev : [...prev, nftId]);
          } else {
            setLikedNFTs(prev => prev.filter(id => id !== nftId));
          }
          
          // Clear optimistic state - actual state now matches
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(nftId);
            return newSet;
          });

          // Clear pending state
          setPendingLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(nftId);
            return newSet;
          });
          
          // Clear watchdog timer if present
          if (watchdogTimers.current.has(nftId)) {
            clearTimeout(watchdogTimers.current.get(nftId)!);
            watchdogTimers.current.delete(nftId);
          }
          
          resolve(true);
        } catch (err: any) {
          console.error('Error toggling like:', err);
          
          // Revert optimistic UI and stats updates on error
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            if (action === 'like') {
              newSet.delete(nftId);
            } else {
              newSet.add(nftId);
            }
            return newSet;
          });
          
          const revertDelta = wasLiked ? 1 : -1;
          window.dispatchEvent(new CustomEvent('nft-stats-update', {
            detail: { nftId, delta: revertDelta }
          }));
          
          // Revert creator stats if needed
          const revertCreatorStats = async () => {
            try {
              const { data: nftData } = await supabase
                .from('nfts')
                .select('creator_user_id')
                .eq('id', nftId)
                .maybeSingle();
              
              if (nftData?.creator_user_id) {
                window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
                  detail: { userId: nftData.creator_user_id, type: 'nft_like', delta: revertDelta }
                }));
                console.log('Reverted creator NFT like stats for user:', nftData.creator_user_id);
              }
            } catch (error) {
              console.error('Error reverting creator stats:', error);
            }
          };
          
          revertCreatorStats();

          // Clear pending state on error too
          setPendingLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(nftId);
            return newSet;
          });
          
          // Clear watchdog timer if present
          if (watchdogTimers.current.has(nftId)) {
            clearTimeout(watchdogTimers.current.get(nftId)!);
            watchdogTimers.current.delete(nftId);
          }
          
          resolve(false);
        }
      }, 75); // 75ms debounce
      
      // Store the timer for this specific NFT
      debounceTimers.current.set(nftId, timeoutId);
    });
  }, [user, likedNFTs]);

  const isLiked = useCallback((nftId: string) => {
    return likedNFTs.includes(nftId) || optimisticLikes.has(nftId);
  }, [likedNFTs, optimisticLikes]);

  const isPending = useCallback((nftId: string) => {
    return pendingLikes.has(nftId);
  }, [pendingLikes]);

  useEffect(() => {
    loadLikedNFTs();

    // Reduced real-time subscription frequency
    if (!user) {
      return;
    }

    const channel = supabase
      .channel('nft-likes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Throttled refresh - only update if no optimistic updates pending
          if (optimisticLikes.size === 0) {
            setTimeout(() => loadLikedNFTs(), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadLikedNFTs, optimisticLikes.size]);

  return {
    likedNFTs,
    loading: pendingLikes.size > 0, // Global loading only if any NFT is pending
    toggleLike,
    isLiked,
    isPending,
    refreshLikes: loadLikedNFTs,
  };
};