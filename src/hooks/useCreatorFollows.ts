import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreatorFollows = () => {
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadFollowedCreators = useCallback(async () => {
    if (!user) {
      setFollowedCreators([]);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-followed-creators');

      if (error) throw error;
      
      if (data?.success) {
        setFollowedCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Error loading followed creators:', err);
      // Don't clear the list on error to preserve optimistic updates
    }
  }, [user]);

  const toggleFollow = useCallback(async (creatorWallet: string) => {
    if (!user) {
      return false;
    }

    const wasFollowing = followedCreators.includes(creatorWallet);
    setLoading(true);

    // Dispatch optimistic update signal
    const delta = wasFollowing ? -1 : 1;
    window.dispatchEvent(new CustomEvent('creator-stats-update', {
      detail: { wallet: creatorWallet, type: 'follow', delta }
    }));

    try {
      const action = wasFollowing ? 'unfollow' : 'follow';

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: { 
          creator_wallet: creatorWallet,
          action,
        },
      });

      if (error) throw error;
      
      // Update local state
      if (action === 'follow') {
        setFollowedCreators(prev => {
          // Prevent duplicates
          if (prev.includes(creatorWallet)) return prev;
          return [...prev, creatorWallet];
        });
        toast.success('Successfully followed creator!');
      } else {
        setFollowedCreators(prev => prev.filter(c => c !== creatorWallet));
        toast.success('Successfully unfollowed creator!');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      toast.error(err.message || 'Failed to update follow status');
      
      // Revert optimistic update on error
      const revertDelta = wasFollowing ? 1 : -1;
      window.dispatchEvent(new CustomEvent('creator-stats-update', {
        detail: { wallet: creatorWallet, type: 'follow', delta: revertDelta }
      }));
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, followedCreators]);

  const isFollowing = useCallback((creatorWallet: string) => {
    return followedCreators.includes(creatorWallet);
  }, [followedCreators]);

  useEffect(() => {
    loadFollowedCreators();

    if (!user) return;

    // Set up real-time subscription for creator follows - only for current user
    const channel = supabase
      .channel('creator-follows-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔥 Real-time creator follows change detected for current user:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          
          // Only refresh if this change is for the current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.user_id === user.id || oldRecord?.user_id === user.id) {
            loadFollowedCreators();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Creator follows subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up creator follows subscription');
      supabase.removeChannel(channel);
    };
  }, [user, loadFollowedCreators]);

  return {
    followedCreators,
    loading,
    toggleFollow,
    isFollowing,
    refreshFollows: loadFollowedCreators,
  };
};