
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

  const ANIME_TOKEN_MINT = 'GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump';

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

      // Transform the data to ensure tier property matches our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        tier: item.tier as 'god' | 'top' | 'boosted' // Type assertion to fix the type mismatch
      }));

      setBoostedListings(transformedData);
    } catch (error) {
      console.error('Error loading boosted listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoost = useCallback(async (nftId: string, bidAmount: number, txSignature: string) => {
    if (!publicKey) return { success: false, error: 'Wallet not connected' };

    try {
      const { data, error } = await supabase.functions.invoke('create-boost', {
        body: {
          nftId,
          bidAmount,
          tokenMint: ANIME_TOKEN_MINT,
          bidderWallet: publicKey,
          txSignature,
        },
      });

      if (error || !data?.success) {
        const msg = (error as any)?.message || data?.error || 'Failed to create boost';
        console.error('Error creating boost:', msg);
        return { success: false, error: msg };
      }

      await loadBoostedListings(); // Refresh the list
      return { success: true, data: data.data };
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
