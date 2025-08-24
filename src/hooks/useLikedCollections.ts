
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
      console.log('Fetching liked collections for wallet:', publicKey);
      
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
        // If embedding fails, try a different approach
        if (error.message?.includes('embedding')) {
          console.log('Trying alternative approach without embedding...');
          await fetchLikedCollectionsAlternative();
          return;
        }
        return;
      }

      console.log('Raw liked collections data:', data);

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

      console.log('Formatted liked collections:', formattedData);
      setLikedCollections(formattedData);
    } catch (error) {
      console.error('Error fetching liked collections:', error);
      // Fallback to alternative approach
      await fetchLikedCollectionsAlternative();
    } finally {
      setLoading(false);
    }
  };

  // Alternative approach: fetch liked collection IDs first, then fetch collection details
  const fetchLikedCollectionsAlternative = async () => {
    try {
      console.log('Using alternative fetch approach...');
      
      // First get the liked collection IDs
      const { data: likedIds, error: likedError } = await supabase
        .from('collection_likes')
        .select('collection_id, created_at')
        .eq('user_wallet', publicKey)
        .order('created_at', { ascending: false });

      if (likedError) {
        console.error('Error fetching liked collection IDs:', likedError);
        return;
      }

      if (!likedIds || likedIds.length === 0) {
        console.log('No liked collections found');
        setLikedCollections([]);
        return;
      }

      console.log('Liked collection IDs:', likedIds);

      // Then fetch collection details
      const collectionIds = likedIds.map(item => item.collection_id);
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name, image_url, site_description, creator_address, mint_price, max_supply, items_redeemed, is_live, verified')
        .in('id', collectionIds);

      if (collectionsError) {
        console.error('Error fetching collection details:', collectionsError);
        return;
      }

      console.log('Collection details:', collections);

      // Merge the data
      const formattedData = likedIds
        .map(likedItem => {
          const collection = collections?.find(c => c.id === likedItem.collection_id);
          if (!collection) return null;
          
          return {
            id: collection.id,
            name: collection.name,
            image_url: collection.image_url,
            site_description: collection.site_description,
            creator_address: collection.creator_address,
            mint_price: collection.mint_price,
            max_supply: collection.max_supply,
            items_redeemed: collection.items_redeemed,
            is_live: collection.is_live,
            verified: collection.verified,
            liked_at: likedItem.created_at,
          };
        })
        .filter(Boolean) as LikedCollection[];

      console.log('Final formatted data:', formattedData);
      setLikedCollections(formattedData);
    } catch (error) {
      console.error('Error in alternative fetch approach:', error);
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
