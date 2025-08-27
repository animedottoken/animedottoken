import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { toast } from 'sonner';
import { useBurnNFT } from './useBurnNFT';

export interface BurnAllNFTsResult {
  success: boolean;
  burned: number;
  failed: number;
  errors?: string[];
}

export const useBurnAllNFTs = () => {
  const [burning, setBurning] = useState(false);
  const { publicKey } = useSolanaWallet();
  const { burnNFT } = useBurnNFT();

  const burnAllNFTs = async (collectionId: string): Promise<BurnAllNFTsResult> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false, burned: 0, failed: 0 };
    }

    setBurning(true);

    try {
      // Get all NFTs in the collection owned by the user
      const { data: nfts, error } = await supabase
        .from('nfts')
        .select('id, mint_address, name')
        .eq('collection_id', collectionId)
        .eq('creator_address', publicKey);

      if (error) {
        throw error;
      }

      if (!nfts || nfts.length === 0) {
        toast.info('No NFTs found in this collection to burn');
        return { success: true, burned: 0, failed: 0 };
      }

      toast.info(`Starting to burn ${nfts.length} NFTs...`);

      let burned = 0;
      let failed = 0;
      const errors: string[] = [];

      // Burn each NFT sequentially to avoid overwhelming the system
      for (const nft of nfts) {
        try {
          const result = await burnNFT(nft.id, nft.mint_address || '');
          if (result.success) {
            burned++;
            toast.success(`Burned "${nft.name}" 🔥`);
          } else {
            failed++;
            errors.push(`Failed to burn "${nft.name}": ${result.error}`);
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to burn "${nft.name}": ${errorMessage}`);
        }
      }

      if (burned > 0) {
        toast.success(`Successfully burned ${burned} NFTs! 🔥`, {
          description: failed > 0 ? `${failed} NFTs failed to burn` : undefined
        });
      }

      if (failed > 0) {
        toast.error(`Failed to burn ${failed} NFTs`, {
          description: 'Check console for details'
        });
        console.error('Burn errors:', errors);
      }

      return {
        success: burned > 0,
        burned,
        failed,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Error burning all NFTs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to burn NFTs';
      toast.error(errorMessage);
      return { success: false, burned: 0, failed: 0, errors: [errorMessage] };
    } finally {
      setBurning(false);
    }
  };

  return {
    burning,
    burnAllNFTs
  };
};