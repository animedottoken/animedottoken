
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const fetchLikedCollections = async () => {
    if (!user) {
      setLikedCollections([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching liked collections for user:', user.id);
      
      // Get liked collection IDs directly from collection_likes table
      const { data: likedData, error: likedError } = await supabase
        .from('collection_likes')
        .select('collection_id, created_at')
        .eq('user_id', user.id);

      if (likedError) {
        console.error('Error fetching liked collection IDs:', likedError);
        return;
      }

      const likedCollectionIds = likedData?.map(l => l.collection_id) || [];
      console.log('Liked collection IDs:', likedCollectionIds);
      
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

      // Create a map of collection_id to like timestamp from the first query
      const likeTimestamps = (likedData || []).reduce((acc, like) => {
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
    if (user) {
      const channel = supabase
        .channel('liked-collections-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collection_likes',
            filter: `user_id=eq.${user.id}`
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
  }, [user]);

  return {
    likedCollections,
    loading,
    refetch: fetchLikedCollections,
  };
};
