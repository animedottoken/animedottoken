import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LikedNFT {
  id: string;
  name: string;
  image_url: string | null;
  mint_address: string;
  creator_address: string;
  owner_address: string;
  price?: number;
  is_listed: boolean;
  collection_id?: string;
  description?: string;
  attributes?: any;
  liked_at: string;
}

export const useLikedNFTs = () => {
  const [likedNFTs, setLikedNFTs] = useState<LikedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchLikedNFTs = async (preserveScrollPosition = false) => {
    if (!user) {
      setLikedNFTs([]);
      return;
    }

    // Save scroll position if requested
    const scrollY = preserveScrollPosition ? window.scrollY : 0;

    setLoading(true);
    try {
      // Get liked NFT IDs from JWT-authenticated edge function
      const { data: likedData, error: likedError } = await supabase.functions.invoke('get-liked-nfts');

      if (likedError) {
        console.error('Error fetching liked NFT IDs:', likedError);
        return;
      }

      const likedNftIds = likedData?.liked_nft_ids || [];
      
      if (likedNftIds.length === 0) {
        setLikedNFTs([]);
        // Restore scroll position if it was saved
        if (preserveScrollPosition && scrollY > 0) {
          setTimeout(() => window.scrollTo(0, scrollY), 0);
        }
        return;
      }

      // Then fetch NFT details for liked NFTs
      const { data: nftsData, error: nftsError } = await supabase
        .from('nfts')
        .select('*')
        .in('id', likedNftIds);

      if (nftsError) {
        console.error('Error fetching NFT details:', nftsError);
        return;
      }

      // Get the like timestamps
      const { data: likesData, error: likesError } = await supabase
        .from('nft_likes')
        .select('nft_id, created_at')
        .eq('user_id', user.id)
        .in('nft_id', likedNftIds);

      if (likesError) {
        console.error('Error fetching like timestamps:', likesError);
      }

      // Create a map of nft_id to like timestamp
      const likeTimestamps = (likesData || []).reduce((acc, like) => {
        acc[like.nft_id] = like.created_at;
        return acc;
      }, {} as Record<string, string>);

      const formattedData = (nftsData || []).map(nft => ({
        id: nft.id,
        name: nft.name,
        image_url: nft.image_url || '',
        mint_address: nft.mint_address,
        creator_address: nft.creator_address,
        owner_address: nft.owner_address,
        price: nft.price,
        is_listed: nft.is_listed,
        collection_id: nft.collection_id,
        description: nft.description,
        attributes: nft.attributes,
        liked_at: likeTimestamps[nft.id] || new Date().toISOString(),
      })).sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime());

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

    if (!user) return;

    // Set up real-time subscription for liked NFTs
    const channel = supabase
      .channel('liked-nfts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nft_likes',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchLikedNFTs(true); // Preserve scroll position on real-time updates
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    likedNFTs,
    loading,
    refetch: fetchLikedNFTs,
  };
};