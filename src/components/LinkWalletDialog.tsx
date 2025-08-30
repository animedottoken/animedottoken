import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Copy, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useUserWallets } from '@/hooks/useUserWallets';
import { truncateAddress } from '@/utils/addressUtils';
import { toast } from 'sonner';

interface LinkWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletType?: 'primary' | 'secondary';
}

export function LinkWalletDialog({ open, onOpenChange, walletType = 'secondary' }: LinkWalletDialogProps) {
  const [step, setStep] = useState<'connect' | 'sign' | 'linking'>('connect');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const { connected, publicKey, connect, signMessage } = useSolanaWallet();
  const { linkWallet, generateLinkingMessage, summary } = useUserWallets();

  const handleConnect = async () => {
    if (!connected) {
      await connect();
    }
    
    if (publicKey) {
      const linkingMessage = generateLinkingMessage(publicKey);
      setMessage(linkingMessage);
      setStep('sign');
    }
  };

  const handleSign = async () => {
    if (!publicKey || !message) return;
    
    try {
      const signedMessage = await signMessage(message);
      if (signedMessage) {
        setSignature(signedMessage);
        setStep('linking');
        
        const success = await linkWallet(publicKey, signedMessage, message, walletType);
        if (success) {
          onOpenChange(false);
          // Reset state
          setStep('connect');
          setMessage('');
          setSignature('');
        } else {
          setStep('sign'); // Go back to signing step on failure
        }
      }
    } catch (error) {
      console.error('Error signing message:', error);
      toast.error('Failed to sign message');
    }
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setStep('connect');
    setMessage('');
    setSignature('');
  };

  // Check if at limit for secondary wallets
  const atSecondaryLimit = walletType === 'secondary' && summary.remaining_secondary_slots === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Link {walletType === 'primary' ? 'Primary' : 'Secondary'} Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {atSecondaryLimit && (
            <Alert className="border-orange-200 bg-orange-50 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum limit of 10 secondary wallets. Please unlink a wallet before adding a new one.
              </AlertDescription>
            </Alert>
          )}

          {!atSecondaryLimit && (
            <>
              {step === 'connect' && (
                <div className="space-y-4">
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                      {walletType === 'primary' 
                        ? 'Your primary wallet serves as your main identity on the platform.'
                        : 'Secondary wallets allow you to view NFTs from multiple wallets in a unified profile.'
                      }
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    {connected && publicKey ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Connected: {truncateAddress(publicKey)}</span>
                        </div>
                        <Button onClick={handleConnect} className="w-full">
                          Continue with This Wallet
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleConnect} className="w-full">
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {step === 'sign' && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      To verify ownership, please sign the message below with your wallet.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="text-sm font-medium">Message to Sign:</label>
                    <div className="mt-2 relative">
                      <div className="p-3 bg-muted rounded-lg border text-sm font-mono whitespace-pre-line">
                        {message}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyMessage}
                        className="absolute top-2 right-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('connect')} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleSign} className="flex-1">
                      Sign Message
                    </Button>
                  </div>
                </div>
              )}

              {step === 'linking' && (
                <div className="space-y-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <div>
                    <h3 className="font-medium">Linking Wallet...</h3>
                    <p className="text-sm text-muted-foreground">
                      Verifying signature and linking wallet to your account.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <Alert className="bg-blue-50 border-blue-200 text-blue-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Security Note:</strong> Each wallet can only be linked to one account. The signature verification ensures you own this wallet.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}