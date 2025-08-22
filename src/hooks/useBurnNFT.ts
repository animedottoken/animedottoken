import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface BurnNFTResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export const useBurnNFT = () => {
  const [burning, setBurning] = useState(false);
  const { publicKey } = useSolanaWallet();

  const burnNFT = async (nftId: string, mintAddress: string): Promise<BurnNFTResult> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    setBurning(true);

    try {
      // Call the burn-nft edge function
      const { data, error } = await supabase.functions.invoke('burn-nft', {
        body: {
          nft_id: nftId,
          mint_address: mintAddress,
          wallet_address: publicKey
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success('NFT burned successfully! 🔥', {
          description: `Transaction: ${data.signature?.slice(0, 8)}...`
        });
        return { success: true, signature: data.signature };
      } else {
        toast.error('Failed to burn NFT', {
          description: data.error || 'Unknown error occurred'
        });
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('Error burning NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to burn NFT', {
        description: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setBurning(false);
    }
  };

  return {
    burning,
    burnNFT
  };
};