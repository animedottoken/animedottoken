import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';


export const useCollectionLikes = () => {
  const { user } = useAuth();
  
  const [likedCollections, setLikedCollections] = useState<string[]>([]);
  const [optimisticLikes, setOptimisticLikes] = useState<Set<string>>(new Set());
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  
  // Per-instance debounce and watchdog timers
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const watchdogTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

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

  const toggleLike = async (collectionId: string): Promise<boolean> => {
    if (!user) return false;

    // Prevent double clicks for this collection
    if (debounceTimers.current.has(collectionId)) {
      return false;
    }

    const isCurrentlyLiked = isLiked(collectionId);
    const action = isCurrentlyLiked ? 'unlike' : 'like';

    console.log(`Toggling collection like: ${action} for collection ${collectionId}`);

    // Mark pending
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

    // Optimistic creator stats event
    const optimisticDelta = isCurrentlyLiked ? -1 : 1;
    window.dispatchEvent(new CustomEvent('optimistic-creator-stats-update', {
      detail: {
        collectionId,
        type: 'collection_likes',
        delta: optimisticDelta
      }
    }));

    // Start watchdog to recover from stuck pending
    if (watchdogTimers.current.has(collectionId)) {
      clearTimeout(watchdogTimers.current.get(collectionId)!);
      watchdogTimers.current.delete(collectionId);
    }
    const watchdogId = setTimeout(() => {
      if (pendingLikes.has(collectionId)) {
        console.warn('Watchdog clearing stuck pending like for collection:', collectionId);
        setPendingLikes(prev => { const ns = new Set(prev); ns.delete(collectionId); return ns; });
        // Revert optimistic state since backend didn't confirm in time
        setOptimisticLikes(prev => {
          const ns = new Set(prev);
          if (action === 'like') { ns.delete(collectionId); } else { ns.add(collectionId); }
          return ns;
        });
        // Revert creator stats
        window.dispatchEvent(new CustomEvent('optimistic-creator-stats-update', {
          detail: { collectionId, type: 'collection_likes', delta: -optimisticDelta }
        }));
        toast({ title: 'Network slow', description: 'Please try again.', variant: 'destructive' });
      }
      watchdogTimers.current.delete(collectionId);
    }, 4000);
    watchdogTimers.current.set(collectionId, watchdogId);

    // Debounce and perform server call
    return new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(async () => {
        // Remove this timer from our map
        debounceTimers.current.delete(collectionId);
        try {
          const { data, error } = await supabase.functions.invoke('like-collection', {
            body: { collection_id: collectionId, action }
          });

          if (error || !data?.success) {
            console.error('Error toggling collection like:', error || data);

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
              detail: { collectionId, type: 'collection_likes', delta: -optimisticDelta }
            }));

            toast({ title: 'Error', description: `Failed to ${action} collection`, variant: 'destructive' });
            throw new Error('Toggle like failed');
          }

          // Success - update actual liked collections
          if (action === 'like') {
            setLikedCollections(prev => [...prev, collectionId]);
          } else {
            setLikedCollections(prev => prev.filter(id => id !== collectionId));
          }

          // Clear optimistic state since it's now reflected in actual state
          setOptimisticLikes(prev => { const ns = new Set(prev); ns.delete(collectionId); return ns; });

          // Clear pending state
          setPendingLikes(prev => { const ns = new Set(prev); ns.delete(collectionId); return ns; });

          // Clear watchdog
          if (watchdogTimers.current.has(collectionId)) {
            clearTimeout(watchdogTimers.current.get(collectionId)!);
            watchdogTimers.current.delete(collectionId);
          }

          resolve(true);
        } catch (err) {
          // Clear pending state on error too
          setPendingLikes(prev => { const ns = new Set(prev); ns.delete(collectionId); return ns; });

          // Clear watchdog on error
          if (watchdogTimers.current.has(collectionId)) {
            clearTimeout(watchdogTimers.current.get(collectionId)!);
            watchdogTimers.current.delete(collectionId);
          }

          resolve(false);
        }
      }, 300);

      // Store debounce timer for this collection
      debounceTimers.current.set(collectionId, timeoutId);
    });
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
