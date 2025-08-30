import { useState, useEffect } from 'react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useUserWallets } from '@/hooks/useUserWallets';
import { toast } from 'sonner';

export const useAutoPrimaryWallet = () => {
  const [showPrimaryPrompt, setShowPrimaryPrompt] = useState(false);
  const { connected, publicKey } = useSolanaWallet();
  const { getPrimaryWallet, linkWallet, generateLinkingMessage } = useUserWallets();

  useEffect(() => {
    const checkForAutoPrimary = async () => {
      // Only show prompt if:
      // 1. Wallet is connected
      // 2. No primary wallet exists
      // 3. Haven't dismissed this prompt before for this wallet
      if (connected && publicKey) {
        const primaryWallet = getPrimaryWallet();
        const dismissedKey = `dismissed-primary-prompt-${publicKey}`;
        const hasBeenDismissed = localStorage.getItem(dismissedKey) === 'true';

        if (!primaryWallet && !hasBeenDismissed) {
          setShowPrimaryPrompt(true);
        }
      } else {
        setShowPrimaryPrompt(false);
      }
    };

    checkForAutoPrimary();
  }, [connected, publicKey, getPrimaryWallet]);

  const handleSetAsPrimary = async () => {
    if (!publicKey) return false;

    try {
      const message = generateLinkingMessage(publicKey);
      // In a real app, we'd need to sign this message
      // For now, we'll simulate a successful signing
      const mockSignature = `mock-signature-${Date.now()}`;
      
      const success = await linkWallet(publicKey, mockSignature, message, 'primary');
      if (success) {
        setShowPrimaryPrompt(false);
        toast.success('Primary wallet set successfully!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      toast.error('Failed to set primary wallet');
      return false;
    }
  };

  const handleDismiss = () => {
    if (publicKey) {
      const dismissedKey = `dismissed-primary-prompt-${publicKey}`;
      localStorage.setItem(dismissedKey, 'true');
    }
    setShowPrimaryPrompt(false);
  };

  return {
    showPrimaryPrompt,
    handleSetAsPrimary,
    handleDismiss,
    connectedWallet: publicKey
  };
};