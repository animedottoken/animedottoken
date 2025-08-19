import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface MintedNFT {
  id: string;
  mint_address: string;
  name: string;
  image_url?: string;
  owner_address: string;
  collection_id: string;
  created_at: string;
  collections?: {
    name: string;
    symbol?: string;
  };
}

export const useCollectionMints = (collectionId?: string) => {
  const [mints, setMints] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useSolanaWallet();

  const loadMints = useCallback(async () => {
    if (!publicKey) {
      setMints([]);
      return;
    }

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
          collection_id,
          created_at,
          collections (
            name,
            symbol
          )
        `)
        .eq('creator_address', publicKey)
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
  }, [publicKey, collectionId]);

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