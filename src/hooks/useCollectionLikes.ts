import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Debounce timer map for per-collection debouncing
const debounceTimers = new Map<string, NodeJS.Timeout>();

export const useCollectionLikes = () => {
  const { user } = useAuth();
  
  const [likedCollections, setLikedCollections] = useState<string[]>([]);
  const [optimisticLikes, setOptimisticLikes] = useState<Set<string>>(new Set());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());

  const loadLikedCollections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-liked-collections');
      
      if (error || !data?.success) {
        console.warn('Edge function failed, falling back to direct query:', error);
        // Fallback to direct database query with RLS
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('collection_likes')
          .select('collection_id')
          .eq('user_id', user.id);
        
        if (!fallbackError && fallbackData) {
          setLikedCollections(fallbackData.map(l => l.collection_id));
        }
        return;
      }
      
      if (data?.liked_collection_ids) {
        setLikedCollections(data.liked_collection_ids);
      }
    } catch (error) {
      console.error('Error calling get-liked-collections function:', error);
      // Keep existing state on error instead of wiping it
    }
  };

  const toggleLike = async (collectionId: string) => {
    if (!user) return;
    
    // Check if we have pending requests for this collection to prevent double clicks
    if (debounceTimers.has(collectionId)) {
      return;
    }

    const isCurrentlyLiked = isLiked(collectionId);
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    
    console.log(`Toggling collection like: ${action} for collection ${collectionId}`);
    
    setPendingLikes(prev => new Set([...prev, collectionId]));
    
    // Optimistic UI update
    setOptimisticLikes(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });

    // Dispatch optimistic update event for creator stats
    const optimisticDelta = isCurrentlyLiked ? -1 : 1;
    window.dispatchEvent(new CustomEvent('optimistic-creator-stats-update', {
      detail: {
        collectionId,
        type: 'collection_likes',
        delta: optimisticDelta
      }
    }));

    // Set debounce timer
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('like-collection', {
          body: {
            collection_id: collectionId,
            action: action
          }
        });

        if (error || !data?.success) {
          console.error('Error toggling collection like:', error);
          
          // Revert optimistic update
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyLiked) {
              newSet.add(collectionId);
            } else {
              newSet.delete(collectionId);
            }
            return newSet;
          });

          // Revert creator stats
          window.dispatchEvent(new CustomEvent('optimistic-creator-stats-update', {
            detail: {
              collectionId,
              type: 'collection_likes',
              delta: -optimisticDelta
            }
          }));
          
          toast({
            title: "Error",
            description: `Failed to ${action} collection`,
            variant: "destructive",
          });
        } else {
          // Success - update actual liked collections
          if (action === 'like') {
            setLikedCollections(prev => [...prev, collectionId]);
          } else {
            setLikedCollections(prev => prev.filter(id => id !== collectionId));
          }
          
          // Clear optimistic state since it's now reflected in actual state
          setOptimisticLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(collectionId);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error calling like-collection function:', error);
        
        // Revert optimistic update
        setOptimisticLikes(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.add(collectionId);
          } else {
            newSet.delete(collectionId);
          }
          return newSet;
        });

        // Revert creator stats
        window.dispatchEvent(new CustomEvent('optimistic-creator-stats-update', {
          detail: {
            collectionId,
            type: 'collection_likes',
            delta: -optimisticDelta
          }
        }));
        
        toast({
          title: "Error",
          description: "Network error occurred",
          variant: "destructive",
        });
      } finally {
        setPendingLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
        debounceTimers.delete(collectionId);
      }
    }, 300);

    debounceTimers.set(collectionId, timeoutId);
  };

  const isLiked = (collectionId: string): boolean => {
    const actuallyLiked = likedCollections.includes(collectionId);
    const optimisticallyLiked = optimisticLikes.has(collectionId);
    
    // XOR: either actually liked OR optimistically liked, but not both
    return actuallyLiked !== optimisticallyLiked ? true : actuallyLiked;
  };

  const isPending = (collectionId: string): boolean => {
    return pendingLikes.has(collectionId);
  };

  useEffect(() => {
    loadLikedCollections();

    // Set up real-time subscription
    if (!user) {
      return;
    }

    const channel = supabase
      .channel('collection-likes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_likes',
          filter: `user_id=eq.${user.id}`
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
  }, [user, optimisticLikes.size]);

  return {
    likedCollections,
    toggleLike,
    isLiked,
    isPending,
    refreshLikes: loadLikedCollections
  };
};
