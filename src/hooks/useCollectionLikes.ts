import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let toggleDebounceTimeout: NodeJS.Timeout | null = null;

export const useCollectionLikes = () => {
  const [likedCollections, setLikedCollections] = useState<string[]>([]);
  const [optimisticLikes, setOptimisticLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useSolanaWallet();

  const loadLikedCollections = useCallback(async () => {
    if (!connected || !publicKey) {
      setLikedCollections([]);
      setOptimisticLikes(new Set());
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-liked-collections', {
        body: { user_wallet: publicKey }
      });

      if (error) throw error;
      
      if (data?.success && data.liked_collection_ids) {
        setLikedCollections(data.liked_collection_ids);
      } else {
        setLikedCollections([]);
      }
    } catch (err) {
      console.error('Error loading liked collections:', err);
      setLikedCollections([]);
    }
  }, [connected, publicKey]);

  const toggleLike = useCallback(async (collectionId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(collectionId)) {
      toast.error('Invalid collection ID');
      return false;
    }

    // Debounce rapid clicks
    if (toggleDebounceTimeout) {
      clearTimeout(toggleDebounceTimeout);
    }

    const wasLiked = likedCollections.includes(collectionId) || optimisticLikes.has(collectionId);
    const action = wasLiked ? 'unlike' : 'like';

    // Optimistic UI update
    setOptimisticLikes(prev => {
      const newSet = new Set(prev);
      if (action === 'like') {
        newSet.add(collectionId);
      } else {
        newSet.delete(collectionId);
      }
      return newSet;
    });

    return new Promise<boolean>((resolve) => {
      toggleDebounceTimeout = setTimeout(async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('like-collection', {
            body: { 
              collection_id: collectionId,
              user_wallet: publicKey,
              action
            },
          });

          if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Network error');
          }
          
          if (!data?.success) {
            const errorCode = data?.code || 'LKC500';
            const friendlyMessage = data?.message || 'Failed to update like status';
            
            // Show friendly error message with error code
            toast.error(`${friendlyMessage} (Error: ${errorCode})`, {
              description: 'You can report this error code to our support team.'
            });
            throw new Error(friendlyMessage);
          }
          
          // Update actual state
          if (action === 'like') {
            setLikedCollections(prev => prev.includes(collectionId) ? prev : [...prev, collectionId]);
          } else {
            setLikedCollections(prev => prev.filter(id => id !== collectionId));
          }
          
          // Clear optimistic state - actual state now matches
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(collectionId);
            return newSet;
          });
          
          resolve(true);
        } catch (err: any) {
          console.error('Error toggling collection like:', err);
          
          // Revert optimistic UI
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            if (action === 'like') {
              newSet.delete(collectionId);
            } else {
              newSet.add(collectionId);
            }
            return newSet;
          });
          
          resolve(false);
        } finally {
          setLoading(false);
        }
      }, 300); // 300ms debounce
    });
  }, [connected, publicKey, likedCollections]);

  const isLiked = useCallback((collectionId: string) => {
    return likedCollections.includes(collectionId) || optimisticLikes.has(collectionId);
  }, [likedCollections, optimisticLikes]);

  useEffect(() => {
    loadLikedCollections();

    // Reduced real-time subscription frequency - only when connected
    if (!connected || !publicKey) {
      return;
    }

    const channelName = `collection-likes-${publicKey}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_likes',
          filter: `user_wallet=eq.${publicKey}`
        },
        () => {
          // Throttled refresh - only update if no optimistic updates pending
          if (optimisticLikes.size === 0) {
            setTimeout(() => loadLikedCollections(), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connected, publicKey, loadLikedCollections, optimisticLikes.size]);

  return {
    likedCollections,
    loading,
    toggleLike,
    isLiked,
    refreshLikes: loadLikedCollections,
  };
};