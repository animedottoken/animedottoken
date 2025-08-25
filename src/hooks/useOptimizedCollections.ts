import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface Collection {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  verified: boolean;
  items_redeemed: number;
  creator_address: string;
  mint_price?: number;
  max_supply?: number;
  is_live: boolean;
  created_at: string;
}

export const useOptimizedCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  // Memoized filtered collections for better performance
  const userCollections = useMemo(() => {
    if (!publicKey) return [];
    return collections.filter(c => c.creator_address === publicKey);
  }, [collections, publicKey]);

  const loadCollections = useCallback(async (limit: number = 50) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections_public')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user's collections efficiently
  const loadUserCollections = useCallback(async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('creator_address', publicKey)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading user collections:', error);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  return {
    collections,
    userCollections,
    loading,
    loadCollections,
    loadUserCollections,
    refreshCollections: loadCollections,
  };
};