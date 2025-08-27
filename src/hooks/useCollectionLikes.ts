
import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCollectionLikes = () => {
  const [likedCollections, setLikedCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey, connected } = useSolanaWallet();

  const loadLikedCollections = useCallback(async () => {
    if (!connected || !publicKey) {
      setLikedCollections([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('collection_likes')
        .select('collection_id')
        .eq('user_wallet', publicKey);

      if (error) throw error;
      setLikedCollections(data?.map(l => l.collection_id) || []);
    } catch (err) {
      console.error('Error loading liked collections:', err);
    }
  }, [connected, publicKey]);

  const toggleLike = useCallback(async (collectionId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    // Validate that collectionId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(collectionId)) {
      console.error('Invalid collection ID provided to toggleLike:', collectionId);
      toast.error('Invalid collection ID');
      return false;
    }

    setLoading(true);
    try {
      const isLiked = likedCollections.includes(collectionId);
      const action = isLiked ? 'unlike' : 'like';

      const { data, error } = await supabase.functions.invoke('like-collection', {
        body: { 
          collection_id: collectionId,
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
        setLikedCollections(prev => [...prev, collectionId]);
        toast.success('Collection liked!');
      } else {
        setLikedCollections(prev => prev.filter(id => id !== collectionId));
        toast.success('Collection unliked!');
      }
      
      // Dispatch event for instant sync across hooks/components
      window.dispatchEvent(new CustomEvent('collection-like-toggled', {
        detail: { collectionId, action }
      }));
      
      return true;
    } catch (err: any) {
      console.error('Error toggling collection like:', err);
      if (err.message?.includes('Collection already liked')) {
        toast.error('Collection already liked');
      } else if (err.message?.includes('violates foreign key constraint')) {
        toast.error('Collection not found');
      } else {
        toast.error(err.message || 'Failed to update like status');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, likedCollections]);

  const isLiked = useCallback((collectionId: string) => {
    return likedCollections.includes(collectionId);
  }, [likedCollections]);

  useEffect(() => {
    loadLikedCollections();

    // Set up real-time subscription for collection likes - only if connected
    if (!connected || !publicKey) {
      return;
    }

    const channelName = `collection-likes-${publicKey}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_likes',
          filter: `user_wallet=eq.${publicKey}`
        },
        (payload) => {
          console.log('🔥 Real-time collection likes change detected:', payload);
          // Refresh liked collections when any change occurs
          loadLikedCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connected, publicKey, loadLikedCollections]);

  return {
    likedCollections,
    loading,
    toggleLike,
    isLiked,
    refreshLikes: loadLikedCollections,
  };
};
