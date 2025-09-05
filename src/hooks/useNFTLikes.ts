import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let toggleDebounceTimeout: NodeJS.Timeout | null = null;

export const useNFTLikes = () => {
  const [likedNFTs, setLikedNFTs] = useState<string[]>([]);
  const [optimisticLikes, setOptimisticLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadLikedNFTs = useCallback(async () => {
    if (!user) {
      setLikedNFTs([]);
      setOptimisticLikes(new Set());
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-liked-nfts');

      if (error) throw error;
      
      if (data?.success && data.liked_nft_ids) {
        setLikedNFTs(data.liked_nft_ids);
      } else {
        setLikedNFTs([]);
      }
    } catch (err) {
      console.error('Error loading liked NFTs:', err);
      setLikedNFTs([]);
    }
  }, [user]);

  const toggleLike = useCallback(async (nftId: string, creatorAddress?: string) => {
    if (!user) {
      return false;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(nftId)) {
      toast.error('Invalid NFT ID - only NFTs can be liked');
      return false;
    }

    // Debounce rapid clicks
    if (toggleDebounceTimeout) {
      clearTimeout(toggleDebounceTimeout);
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
      toggleDebounceTimeout = setTimeout(async () => {
        setLoading(true);
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
          
          resolve(false);
        } finally {
          setLoading(false);
        }
      }, 300); // 300ms debounce
    });
  }, [user, likedNFTs]);

  const isLiked = useCallback((nftId: string) => {
    return likedNFTs.includes(nftId) || optimisticLikes.has(nftId);
  }, [likedNFTs, optimisticLikes]);

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
    loading,
    toggleLike,
    isLiked,
    refreshLikes: loadLikedNFTs,
  };
};