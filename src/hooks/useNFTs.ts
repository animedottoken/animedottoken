import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface NFT {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  metadata_uri?: string;
  mint_address: string;
  owner_address: string;
  creator_address: string;
  collection_id?: string;
  price?: number;
  currency?: string;
  is_listed: boolean;
  attributes?: any;
  created_at: string;
  updated_at: string;
}

export const useNFTs = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useSolanaWallet();

  const loadNFTs = useCallback(async () => {
    if (!publicKey) {
      setNfts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_address', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setNfts(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  const refreshNFTs = () => {
    loadNFTs();
  };

  return {
    nfts,
    loading,
    error,
    refreshNFTs
  };
};