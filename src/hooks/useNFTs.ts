import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NFT {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  price?: number;
  is_listed: boolean;
  category?: string;
  creator_address: string;
  owner_address: string;
  mint_address: string;
  created_at: string;
  attributes?: any;
  collection_id?: string;
  collections?: {
    name: string;
  };
}

export const useNFTs = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('nfts')
        .select(`
          *,
          collections (
            name
          )
        `)
        .eq('is_listed', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching NFTs:', error);
        setError(error.message);
        return;
      }

      setNfts(data || []);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs
  };
};