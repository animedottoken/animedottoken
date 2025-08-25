import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface LikedNFT {
  id: string;
  name: string;
  image_url: string | null;
  mint_address: string;
  creator_address: string;
  owner_address: string;
  liked_at: string;
}

export const useLikedNFTs = () => {
  const [likedNFTs, setLikedNFTs] = useState<LikedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  const fetchLikedNFTs = async (preserveScrollPosition = false) => {
    if (!publicKey) {
      setLikedNFTs([]);
      return;
    }

    // Save scroll position if requested
    const scrollY = preserveScrollPosition ? window.scrollY : 0;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nft_likes')
        .select(`
          created_at,
          nfts (
            id,
            name,
            image_url,
            mint_address,
            creator_address,
            owner_address
          )
        `)
        .eq('user_wallet', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching liked NFTs:', error);
        return;
      }

      const formattedData = data
        ?.filter(item => item.nfts)
        ?.map(item => ({
          id: item.nfts.id,
          name: item.nfts.name,
          image_url: item.nfts.image_url || '',
          mint_address: item.nfts.mint_address,
          creator_address: item.nfts.creator_address,
          owner_address: item.nfts.owner_address,
          liked_at: item.created_at,
        })) || [];

      setLikedNFTs(formattedData);

      // Restore scroll position if it was saved
      if (preserveScrollPosition && scrollY > 0) {
        setTimeout(() => window.scrollTo(0, scrollY), 0);
      }
    } catch (error) {
      console.error('Error fetching liked NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedNFTs();

    if (!publicKey) return;

    // Set up real-time subscription for liked NFTs
    const channel = supabase
      .channel('liked-nfts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes',
          filter: `user_wallet=eq.${publicKey}`
        },
        () => {
          fetchLikedNFTs(true); // Preserve scroll position on real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicKey]);

  return {
    likedNFTs,
    loading,
    refetch: fetchLikedNFTs,
  };
};