
import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bs58 from 'bs58';

export const useCreatorFollows = () => {
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const { publicKey, connected } = useSolanaWallet();

  const loadFollowedCreators = useCallback(async () => {
    if (!connected || !publicKey) {
      setFollowedCreators([]);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-followed-creators', {
        body: { follower_wallet: publicKey },
      });

      if (error) throw error;
      
      if (data?.success) {
        setFollowedCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Error loading followed creators:', err);
      // Don't clear the list on error to preserve optimistic updates
    }
  }, [connected, publicKey]);

  const getOrCreateSessionToken = useCallback(async () => {
    if (!connected || !publicKey) return null;

    // Check if current session token is still valid (with 2 min buffer)
    if (sessionToken && sessionExpiry && Date.now() < (sessionExpiry - 2 * 60 * 1000)) {
      return sessionToken;
    }

    try {
      // Get wallet provider for signing
      const anyWin: any = window as any;
      const providers = anyWin?.solana?.providers ?? [anyWin?.solana].filter(Boolean);
      const provider = providers?.find((p: any) => typeof p?.signMessage === 'function' && (p?.isConnected || p?.connected)) || providers?.[0];
      if (!provider?.signMessage) {
        throw new Error('Wallet does not support message signing');
      }

      // Sign session start message
      const timestamp = Date.now().toString();
      const message = `follow-session-start:${publicKey}:${timestamp}`;
      const encoded = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encoded, 'utf8');
      const sigBytes: Uint8Array = (signed && signed.signature) ? new Uint8Array(signed.signature) : new Uint8Array(signed);
      const signature = bs58.encode(sigBytes);

      const { data, error } = await supabase.functions.invoke('follow-session/start', {
        body: {
          wallet_address: publicKey,
          signature,
          message,
          timestamp,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setSessionToken(data.session_token);
        setSessionExpiry(data.expires_at);
        console.log('📝 Session token created, expires at:', new Date(data.expires_at));
        return data.session_token;
      }
    } catch (err) {
      console.error('Failed to create session token:', err);
      return null;
    }
  }, [connected, publicKey, sessionToken, sessionExpiry]);

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

      // Try to use session token first
      let token = await getOrCreateSessionToken();
      let requestBody: any = {
        creator_wallet: creatorWallet,
        follower_wallet: publicKey,
        action,
      };

      if (token) {
        requestBody.session_token = token;
      } else {
        // Fallback to signature-based auth
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

        requestBody = {
          ...requestBody,
          message,
          timestamp,
          signature,
        };
      }

      const { data, error } = await supabase.functions.invoke('toggle-follow', {
        body: requestBody,
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
  }, [connected, publicKey, followedCreators, getOrCreateSessionToken]);

  const isFollowing = useCallback((creatorWallet: string) => {
    return followedCreators.includes(creatorWallet);
  }, [followedCreators]);

  useEffect(() => {
    loadFollowedCreators();

    if (!connected || !publicKey) {
      // Clear session when disconnected
      setSessionToken(null);
      setSessionExpiry(null);
      return;
    }

    // Set up real-time subscription for creator follows - only for current user
    const channel = supabase
      .channel('creator-follows-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_follows',
          filter: `follower_wallet=eq.${publicKey}`
        },
        (payload) => {
          console.log('🔥 Real-time creator follows change detected for current user:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          
          // Only refresh if this change is for the current user
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.follower_wallet === publicKey || oldRecord?.follower_wallet === publicKey) {
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
  }, [connected, publicKey, loadFollowedCreators]);

  return {
    followedCreators,
    loading,
    toggleFollow,
    isFollowing,
    refreshFollows: loadFollowedCreators,
  };
};
