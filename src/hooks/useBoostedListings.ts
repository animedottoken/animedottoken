
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface BoostedListing {
  id: string;
  nft_id: string;
  bid_amount: number;
  token_mint: string;
  bidder_wallet: string;
  tx_signature: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  nft_name: string;
  nft_image_url: string;
  owner_address: string;
  bid_rank: number;
  tier: 'god' | 'top' | 'boosted';
}

export const useBoostedListings = () => {
  const [boostedListings, setBoostedListings] = useState<BoostedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  const loadBoostedListings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('boosted_leaderboard')
        .select('*')
        .order('bid_rank', { ascending: true });

      if (error) {
        console.error('Error loading boosted listings:', error);
        return;
      }

      setBoostedListings(data || []);
    } catch (error) {
      console.error('Error loading boosted listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoost = useCallback(async (nftId: string, bidAmount: number, txSignature: string) => {
    if (!publicKey) return { success: false, error: 'Wallet not connected' };

    try {
      const { data, error } = await supabase
        .from('boosted_listings')
        .insert({
          nft_id: nftId,
          bidder_wallet: publicKey,
          bid_amount: bidAmount,
          token_mint: 'ANIME_TOKEN_MINT', // TODO: Replace with actual $ANIME token mint
          tx_signature: txSignature
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating boost:', error);
        return { success: false, error: error.message };
      }

      await loadBoostedListings(); // Refresh the list
      return { success: true, data };
    } catch (error) {
      console.error('Error creating boost:', error);
      return { success: false, error: 'Failed to create boost' };
    }
  }, [publicKey, loadBoostedListings]);

  const getTopBids = useCallback((limit = 10) => {
    return boostedListings.slice(0, limit);
  }, [boostedListings]);

  const canUserBoost = useCallback((nftOwnerId: string) => {
    return publicKey === nftOwnerId;
  }, [publicKey]);

  useEffect(() => {
    loadBoostedListings();
  }, [loadBoostedListings]);

  return {
    boostedListings,
    loading,
    createBoost,
    getTopBids,
    canUserBoost,
    refreshBoostedListings: loadBoostedListings
  };
};
