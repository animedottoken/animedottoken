
import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNFTLikes = () => {
  const [likedNFTs, setLikedNFTs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useSolanaWallet();

  const loadLikedNFTs = useCallback(async () => {
    if (!connected || !publicKey) {
      setLikedNFTs([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('nft_likes')
        .select('nft_id')
        .eq('user_wallet', publicKey);

      if (error) throw error;
      setLikedNFTs(data?.map(l => l.nft_id) || []);
    } catch (err) {
      console.error('Error loading liked NFTs:', err);
    }
  }, [connected, publicKey]);

  const toggleLike = useCallback(async (nftId: string, creatorAddress?: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    // Validate that nftId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(nftId)) {
      console.error('Invalid NFT ID provided to toggleLike:', nftId);
      toast.error('Invalid NFT ID - only NFTs can be liked');
      return false;
    }

    const wasLiked = likedNFTs.includes(nftId);
    setLoading(true);

    // If creator address provided, dispatch optimistic update signal
    if (creatorAddress) {
      const delta = wasLiked ? -1 : 1;
      window.dispatchEvent(new CustomEvent('creator-stats-update', {
        detail: { wallet: creatorAddress, type: 'nft_like', delta }
      }));
    }

    try {
      const action = wasLiked ? 'unlike' : 'like';

      const { data, error } = await supabase.functions.invoke('like-nft', {
        body: { 
          nft_id: nftId,
          user_wallet: publicKey,
          action
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      // Update local state
      if (action === 'like') {
        setLikedNFTs(prev => [...prev, nftId]);
        toast.success('NFT liked!');
      } else {
        setLikedNFTs(prev => prev.filter(id => id !== nftId));
        toast.success('NFT unliked!');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error toggling like:', err);
      if (err.message?.includes('violates foreign key constraint')) {
        toast.error('This item cannot be liked - only NFTs can be liked');
      } else {
        toast.error(err.message || 'Failed to update like status');
      }
      
      // Revert optimistic update on error if creator address provided
      if (creatorAddress) {
        const revertDelta = wasLiked ? 1 : -1;
        window.dispatchEvent(new CustomEvent('creator-stats-update', {
          detail: { wallet: creatorAddress, type: 'nft_like', delta: revertDelta }
        }));
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, likedNFTs]);

  const isLiked = useCallback((nftId: string) => {
    return likedNFTs.includes(nftId);
  }, [likedNFTs]);

  useEffect(() => {
    loadLikedNFTs();

    // Set up real-time subscription for NFT likes
    const channel = supabase
      .channel('nft-likes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes'
        },
        (payload) => {
          console.log('🔥 Real-time NFT likes change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Table:', payload.table);
          // Refresh liked NFTs when any change occurs
          loadLikedNFTs();
        }
      )
      .subscribe((status) => {
        console.log('🔌 NFT Likes subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up NFT likes subscription');
      supabase.removeChannel(channel);
    };
  }, [connected, publicKey]);

  return {
    likedNFTs,
    loading,
    toggleLike,
    isLiked,
    refreshLikes: loadLikedNFTs,
  };
};
