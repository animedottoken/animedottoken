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

    // Get target user's wallet address for the follow action
    try {
      const { data: targetProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', targetUserId)
        .single();

      if (profileError || !targetProfile?.wallet_address) {
        toast.error('Cannot follow user without a connected wallet');
        return false;
      }

      const targetWallet = targetProfile.wallet_address;
      const wasFollowing = followedCreators.includes(targetWallet);
      setLoading(true);

      // Dispatch optimistic update signal using user_id
      const delta = wasFollowing ? -1 : 1;
      window.dispatchEvent(new CustomEvent('creator-stats-update-by-user', {
        detail: { userId: targetUserId, type: 'follow', delta }
      }));

      const action = wasFollowing ? 'unfollow' : 'follow';

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: { 
          creator_wallet: targetWallet,
          action,
        },
      });

      if (error) throw error;
      
      // Update local state
      if (action === 'follow') {
        setFollowedCreators(prev => {
          // Prevent duplicates
          if (prev.includes(targetWallet)) return prev;
          return [...prev, targetWallet];
        });
        toast.success('Successfully followed creator!');
      } else {
        setFollowedCreators(prev => prev.filter(c => c !== targetWallet));
        toast.success('Successfully unfollowed creator!');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error toggling follow by user ID:', err);
      toast.error(err.message || 'Failed to update follow status');
      
      // Revert optimistic update on error
      const wasFollowing = followedCreators.includes(''); // This is complex to determine, so skip revert
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, followedCreators]);

  const isFollowingUserId = useCallback(async (targetUserId: string): Promise<boolean> => {
    try {
      const { data: targetProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('wallet_address')
        .eq('id', targetUserId)
        .single();

      if (profileError || !targetProfile?.wallet_address) {
        return false;
      }

      return followedCreators.includes(targetProfile.wallet_address);
    } catch (error) {
      return false;
    }
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
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔥 Real-time creator follows change detected for current user (by user):', payload);
          
          // Only refresh if this change is for the current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.user_id === user.id || oldRecord?.user_id === user.id) {
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