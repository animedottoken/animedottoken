import { useState, useEffect } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
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
      // For now, return empty array since nfts table may not exist yet
      // This will be populated when NFT minting is fully implemented
      setNfts([]);
      
      // TODO: Replace with actual NFT query when database schema is ready
      // const { data, error: queryError } = await supabase
      //   .from('user_nfts')
      //   .select('*')
      //   .eq('owner_address', publicKey)
      //   .order('created_at', { ascending: false });
      
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