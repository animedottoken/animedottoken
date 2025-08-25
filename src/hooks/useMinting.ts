import { useState } from 'react';
import { solanaService } from '@/services/solanaService';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface MintResult {
  success: boolean;
  signature?: string;
  error?: string;
  nftAddress?: string;
}

export const useMinting = () => {
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const { publicKey } = useSolanaWallet();

  const mintNFT = async (collectionId: string) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      // Preflight check for collection mint address
      // This provides early feedback before calling the service
      const result = await solanaService.mintNFT({
        walletAddress: publicKey,
        collectionId,
        payerSignature: null // For real implementation, this would be the signed transaction
      });

      setMintResult(result);

      if (result.success) {
        toast.success(`Successfully minted NFT! 🎉`, {
          description: `Transaction: ${result.signature?.slice(0, 8)}...`,
          action: {
            label: 'Go to Profile',
            onClick: () => { window.location.href = '/profile'; }
          }
        });
      } else {
        toast.error('Minting failed', {
          description: result.error
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Minting failed', {
        description: errorMessage
      });
      setMintResult({ success: false, error: errorMessage });
    } finally {
      setIsMinting(false);
    }
  };

  const clearMintResult = () => {
    setMintResult(null);
  };

  return {
    isMinting,
    mintResult,
    mintNFT,
    clearMintResult
  };
};