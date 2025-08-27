
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

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
      
      // First get liked collection IDs from edge function (bypasses RLS)
      const { data: likedData, error: likedError } = await supabase.functions.invoke('get-liked-collections', {
        body: { user_wallet: publicKey }
      });

      if (likedError) {
        console.error('Error fetching liked collection IDs:', likedError);
        return;
      }

      const likedCollectionIds = likedData?.liked_collection_ids || [];
      console.log('Liked collection IDs from edge function:', likedCollectionIds);
      
      if (likedCollectionIds.length === 0) {
        setLikedCollections([]);
        return;
      }

      // Then fetch collection details for liked collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name, image_url, site_description, creator_address, mint_price, max_supply, items_redeemed, is_live, verified')
        .in('id', likedCollectionIds);

      if (collectionsError) {
        console.error('Error fetching collection details:', collectionsError);
        return;
      }

      // Get the like timestamps
      const { data: likesData, error: likesError } = await supabase
        .from('collection_likes')
        .select('collection_id, created_at')
        .eq('user_wallet', publicKey)
        .in('collection_id', likedCollectionIds);

      if (likesError) {
        console.error('Error fetching like timestamps:', likesError);
      }

      // Create a map of collection_id to like timestamp
      const likeTimestamps = (likesData || []).reduce((acc, like) => {
        acc[like.collection_id] = like.created_at;
        return acc;
      }, {} as Record<string, string>);

      const formattedData = (collectionsData || []).map(collection => ({
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
        liked_at: likeTimestamps[collection.id] || new Date().toISOString(),
      })).sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime());

      console.log('Formatted liked collections:', formattedData);
      setLikedCollections(formattedData);
    } catch (error) {
      console.error('Error fetching liked collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedCollections();

    // Set up real-time subscription for collection likes
    if (publicKey) {
      const channel = supabase
        .channel('liked-collections-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_likes',
            filter: `user_wallet=eq.${publicKey}`
          },
          (payload) => {
            console.log('🔥 Real-time liked collections change detected:', payload);
            // Refresh liked collections when changes occur for this user
            fetchLikedCollections();
          }
        )
        .subscribe((status) => {
          console.log('🔌 Liked Collections subscription status:', status);
        });

      // Listen for instant local sync events
      const handleCollectionLikeToggled = (event: CustomEvent) => {
        const { collectionId, action } = event.detail;
        console.log('📡 Received collection-like-toggled event:', { collectionId, action });
        
        // Optimistically update local state
        if (action === 'like') {
          // We'd need collection details to add it properly, so just refetch
          fetchLikedCollections();
        } else {
          // Remove from local state immediately
          setLikedCollections(prev => prev.filter(c => c.id !== collectionId));
        }
      };

      window.addEventListener('collection-like-toggled', handleCollectionLikeToggled as EventListener);

      return () => {
        console.log('🔌 Cleaning up liked collections subscription and events');
        supabase.removeChannel(channel);
        window.removeEventListener('collection-like-toggled', handleCollectionLikeToggled as EventListener);
      };
    }
  }, [publicKey]);

  return {
    likedCollections,
    loading,
    refetch: fetchLikedCollections,
  };
};
