
import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreatorFollows = () => {
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useSolanaWallet();

  const loadFollowedCreators = useCallback(async () => {
    if (!connected || !publicKey) {
      setFollowedCreators([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('creator_follows')
        .select('creator_wallet')
        .eq('follower_wallet', publicKey);

      if (error) throw error;
      setFollowedCreators(data?.map(f => f.creator_wallet) || []);
    } catch (err) {
      console.error('Error loading followed creators:', err);
    }
  }, [connected, publicKey]);

  const toggleFollow = useCallback(async (creatorWallet: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setLoading(true);
    try {
      const isFollowing = followedCreators.includes(creatorWallet);
      const action = isFollowing ? 'unfollow' : 'follow';

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: { 
          creator_wallet: creatorWallet,
          follower_wallet: publicKey,
          action
        },
      });

      if (error) throw error;
      
      // Update local state
      if (action === 'follow') {
        setFollowedCreators(prev => [...prev, creatorWallet]);
        toast.success('Successfully followed creator!');
      } else {
        setFollowedCreators(prev => prev.filter(c => c !== creatorWallet));
        toast.success('Successfully unfollowed creator!');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      toast.error(err.message || 'Failed to update follow status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, followedCreators]);

  const isFollowing = useCallback((creatorWallet: string) => {
    return followedCreators.includes(creatorWallet);
  }, [followedCreators]);

  useEffect(() => {
    loadFollowedCreators();

    // Set up real-time subscription for creator follows
    const channel = supabase
      .channel('creator_follows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows'
        },
        (payload) => {
          console.log('Creator follows change detected:', payload);
          // Refresh followed creators when any change occurs
          loadFollowedCreators();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFollowedCreators]);

  return {
    followedCreators,
    loading,
    toggleFollow,
    isFollowing,
    refreshFollows: loadFollowedCreators,
  };
};
