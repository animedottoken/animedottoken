
import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bs58 from 'bs58';

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

    const wasFollowing = followedCreators.includes(creatorWallet);
    setLoading(true);

    // Dispatch optimistic update signal
    const delta = wasFollowing ? -1 : 1;
    window.dispatchEvent(new CustomEvent('creator-stats-update', {
      detail: { wallet: creatorWallet, type: 'follow', delta }
    }));

    try {
      const action = wasFollowing ? 'unfollow' : 'follow';

      // Prepare and sign a message with the connected wallet
      const anyWin: any = window as any;
      const providers = anyWin?.solana?.providers ?? [anyWin?.solana].filter(Boolean);
      const provider = providers?.find((p: any) => typeof p?.signMessage === 'function' && (p?.isConnected || p?.connected)) || providers?.[0];
      if (!provider?.signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      const timestamp = Date.now().toString();
      const message = `toggle-follow:${creatorWallet}:${publicKey}:${action}:${timestamp}`;
      const encoded = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encoded, 'utf8');
      const sigBytes: Uint8Array = (signed && signed.signature) ? new Uint8Array(signed.signature) : new Uint8Array(signed);
      const signature = bs58.encode(sigBytes);

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: { 
          creator_wallet: creatorWallet,
          follower_wallet: publicKey,
          action,
          message,
          timestamp,
          signature,
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
      
      // Revert optimistic update on error
      const revertDelta = wasFollowing ? 1 : -1;
      window.dispatchEvent(new CustomEvent('creator-stats-update', {
        detail: { wallet: creatorWallet, type: 'follow', delta: revertDelta }
      }));
      
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
      .channel('creator-follows-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows'
        },
        (payload) => {
          console.log('🔥 Real-time creator follows change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          // Refresh followed creators when any change occurs
          loadFollowedCreators();
        }
      )
      .subscribe((status) => {
        console.log('🔌 Creator follows subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up creator follows subscription');
      supabase.removeChannel(channel);
    };
  }, [connected, publicKey]);

  return {
    followedCreators,
    loading,
    toggleFollow,
    isFollowing,
    refreshFollows: loadFollowedCreators,
  };
};
