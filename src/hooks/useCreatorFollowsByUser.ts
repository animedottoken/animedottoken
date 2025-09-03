import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreatorFollowsByUser = () => {
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

  const toggleFollowByUserId = useCallback(async (targetUserId: string) => {
    if (!user) {
      return false;
    }

    const wasFollowing = followedCreators.includes(targetUserId);
    const delta = wasFollowing ? -1 : 1;

    try {
      setLoading(true);

      // Optimistic UI: update local state immediately
      if (wasFollowing) {
        setFollowedCreators(prev => prev.filter(c => c !== targetUserId));
      } else {
        setFollowedCreators(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
      }

      // Dispatch TWO optimistic events - one for follower count, one for following count
      window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
        detail: { userId: targetUserId, type: 'follower', delta }
      }));
      
      window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
        detail: { userId: user.id, type: 'following', delta }
      }));

      const action = wasFollowing ? 'unfollow' : 'follow';

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: { 
          target_user_id: targetUserId,
          action,
        },
      });

      if (error) throw error;
      
      toast.success(action === 'follow' ? 'Successfully followed creator!' : 'Successfully unfollowed creator!');
      return true;
    } catch (err: any) {
      console.error('Error toggling follow by user ID:', err);
      toast.error(err.message || 'Failed to update follow status');
      
      // Revert optimistic updates on error
      const revertDelta = wasFollowing ? 1 : -1;
      
      // Revert follower count for target user
      window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
        detail: { userId: targetUserId, type: 'follower', delta: revertDelta }
      }));
      
      // Revert following count for current user
      window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
        detail: { userId: user.id, type: 'following', delta: revertDelta }
      }));
      
      // Revert local state
      if (wasFollowing) {
        setFollowedCreators(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
      } else {
        setFollowedCreators(prev => prev.filter(c => c !== targetUserId));
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, followedCreators]);

  const isFollowingUserId = useCallback((targetUserId: string): boolean => {
    return followedCreators.includes(targetUserId);
  }, [followedCreators]);

  useEffect(() => {
    loadFollowedCreators();

    if (!user) return;

    // Set up real-time subscription for creator follows - only for current user
    const channel = supabase
      .channel('creator-follows-realtime-by-user')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows',
          filter: `follower_user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔥 Real-time creator follows change detected for current user (by user):', payload);
          
          // Only refresh if this change is for the current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.follower_user_id === user.id || oldRecord?.follower_user_id === user.id) {
            loadFollowedCreators();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFollowedCreators]);

  return {
    followedCreators,
    loading,
    toggleFollowByUserId,
    isFollowingUserId,
    refreshFollows: loadFollowedCreators,
  };
};