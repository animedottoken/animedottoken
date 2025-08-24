import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface LikedCollection {
  id: string;
  name: string;
  image_url: string | null;
  site_description: string | null;
  creator_address: string;
  mint_price: number;
  max_supply: number | null;
  items_redeemed: number;
  is_live: boolean;
  verified: boolean;
  liked_at: string;
}

export const useLikedCollections = () => {
  const [likedCollections, setLikedCollections] = useState<LikedCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  const fetchLikedCollections = async () => {
    if (!publicKey) {
      setLikedCollections([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collection_likes')
        .select(`
          created_at,
          collections (
            id,
            name,
            image_url,
            site_description,
            creator_address,
            mint_price,
            max_supply,
            items_redeemed,
            is_live,
            verified
          )
        `)
        .eq('user_wallet', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching liked collections:', error);
        return;
      }

      const formattedData = data
        ?.filter(item => item.collections)
        ?.map(item => ({
          id: item.collections.id,
          name: item.collections.name,
          image_url: item.collections.image_url,
          site_description: item.collections.site_description,
          creator_address: item.collections.creator_address,
          mint_price: item.collections.mint_price,
          max_supply: item.collections.max_supply,
          items_redeemed: item.collections.items_redeemed,
          is_live: item.collections.is_live,
          verified: item.collections.verified,
          liked_at: item.created_at,
        })) || [];

      setLikedCollections(formattedData);
    } catch (error) {
      console.error('Error fetching liked collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedCollections();
  }, [publicKey]);

  return {
    likedCollections,
    loading,
    refetch: fetchLikedCollections,
  };
};