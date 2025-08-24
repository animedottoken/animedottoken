import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BoostedListing {
  id: string;
  nft_id: string;
  token_mint: string;
  bid_amount: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  bidder_wallet: string;
  created_at: string;
  updated_at: string;
  nft?: {
    id: string;
    name: string;
    image_url: string;
    mint_address: string;
  };
}

export const useUserBoostedListings = (walletAddress?: string) => {
  const [boostedListings, setBoostedListings] = useState<BoostedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoostedListings = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch boosted listings for the user with NFT details
      const { data, error: fetchError } = await supabase
        .from('boosted_listings')
        .select(`
          id,
          nft_id,
          token_mint,
          bid_amount,
          start_time,
          end_time,
          is_active,
          bidder_wallet,
          created_at,
          updated_at,
          nfts (
            id,
            name,
            image_url,
            mint_address
          )
        `)
        .eq('bidder_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to flatten the NFT details
      const transformedData = data?.map(listing => ({
        ...listing,
        nft: listing.nfts
      })) || [];

      setBoostedListings(transformedData);
    } catch (err) {
      console.error('Error loading boosted listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load boosted listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoostedListings();
  }, [walletAddress]);

  const refreshBoostedListings = () => {
    loadBoostedListings();
  };

  return {
    boostedListings,
    loading,
    error,
    refreshBoostedListings
  };
};