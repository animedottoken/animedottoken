import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MintedNFT {
  id: string;
  mint_address: string;
  name: string;
  image_url: string;
  owner_address: string;
  creator_address: string;
  collection_id: string;
  created_at: string;
  price?: number;
  is_listed: boolean;
  description?: string;
  attributes?: any;
  collections?: {
    name: string;
    symbol?: string;
  };
}

export const useCollectionMints = (collectionId?: string) => {
  const [mints, setMints] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('nfts')
        .select(`
          id,
          mint_address,
          name,
          image_url,
          owner_address,
          creator_address,
          collection_id,
          created_at,
          price,
          is_listed,
          description,
          attributes,
          collections (
            name,
            symbol
          )
        `)
        .order('created_at', { ascending: false });

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
      } else {
        setMints(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadMints();
  }, [loadMints]);

  const refreshMints = () => {
    loadMints();
  };

  return {
    mints,
    loading,
    error,
    refreshMints
  };
};