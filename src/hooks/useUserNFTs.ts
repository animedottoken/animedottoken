import { useState, useEffect } from 'react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserNFT {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  image_url?: string;
  mint_address?: string;
  collection_id?: string;
  collection_name?: string;
  owner_address: string;
  creator_address?: string;
  price?: number;
  is_listed?: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useUserNFTs = () => {
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, connected } = useSolanaWallet();

  const fetchUserNFTs = async () => {
    if (!connected || !publicKey) {
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query for NFTs owned by the user
      const { data, error: queryError } = await supabase
        .from('nfts')
        .select(`
          id,
          name,
          symbol,
          description,
          image_url,
          mint_address,
          collection_id,
          owner_address,
          attributes,
          price,
          is_listed,
          creator_address,
          created_at,
          updated_at,
          collections (
            name
          )
        `)
        .eq('owner_address', publicKey)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      // Transform the data to include collection name
      const transformedNFTs: UserNFT[] = (data || []).map(nft => {
        // Handle the case where nft might have joined collections data
        const collectionName = (nft as any).collections?.name || undefined;
        
        return {
          id: nft.id,
          name: nft.name,
          symbol: nft.symbol,
          description: nft.description,
          image_url: nft.image_url,
          mint_address: nft.mint_address,
          collection_id: nft.collection_id,
          owner_address: nft.owner_address,
          creator_address: nft.creator_address,
          price: nft.price,
          is_listed: nft.is_listed,
          metadata: nft.attributes,
          created_at: nft.created_at,
          updated_at: nft.updated_at,
          collection_name: collectionName
        };
      });

      setNfts(transformedNFTs);
    } catch (err) {
      console.error('Error fetching user NFTs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFTs';
      setError(errorMessage);
      toast.error('Failed to load your NFTs');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when wallet connects
  useEffect(() => {
    fetchUserNFTs();
  }, [connected, publicKey]);

  const refreshNFTs = () => {
    fetchUserNFTs();
  };

  return {
    nfts,
    loading,
    error,
    refreshNFTs,
    fetchUserNFTs
  };
};