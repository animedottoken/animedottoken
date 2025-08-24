
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

  const toggleLike = useCallback(async (nftId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setLoading(true);
    try {
      const isLiked = likedNFTs.includes(nftId);
      const action = isLiked ? 'unlike' : 'like';

      const { data, error } = await supabase.functions.invoke('like-nft', {
        body: { 
          nft_id: nftId,
          user_wallet: publicKey,
          action
        },
      });

      if (error) throw error;
      
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
      toast.error(err.message || 'Failed to update like status');
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
  }, [loadLikedNFTs]);

  return {
    likedNFTs,
    loading,
    toggleLike,
    isLiked,
    refreshLikes: loadLikedNFTs,
  };
};
