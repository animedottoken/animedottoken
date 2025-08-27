import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

// Separate interfaces for masked vs user data
interface Collection {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  verified: boolean;
  items_redeemed: number;
  creator_address_masked: string;
  mint_price?: number;
  max_supply?: number;
  is_live: boolean;
  created_at: string;
}

interface UserCollection {
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
  const [userCollections, setUserCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  // Load public collections efficiently  
  const loadCollections = useCallback(async (limit: number = 50) => {
    setLoading(true);
    try {
      // Use the secure RPC function for public collections
      const { data, error } = await supabase.rpc('get_collections_public_masked');

      if (error) throw error;
      
      // Apply limit and ordering client-side since RPC doesn't support these parameters
      const sortedData = (data || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
        
      setCollections(sortedData);
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
      setUserCollections(data || []);
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