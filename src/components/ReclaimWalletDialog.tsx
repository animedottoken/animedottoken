import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { useUserWallets } from '@/hooks/useUserWallets';
import { toast } from 'sonner';

interface ReclaimWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  onSuccess?: () => void;
}

export const ReclaimWalletDialog = ({ 
  open, 
  onOpenChange, 
  walletAddress, 
  onSuccess 
}: ReclaimWalletDialogProps) => {
  const [step, setStep] = useState<'confirm' | 'sign' | 'reclaiming'>('confirm');
  const [message, setMessage] = useState('');
  const { connected, publicKey, signMessage } = useSolanaWallet();
  const { reclaimWallet, generateReclaimMessage } = useUserWallets();

  const handleProceed = () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (publicKey !== walletAddress) {
      toast.error('Connected wallet must match the wallet you want to reclaim');
      return;
    }

    const reclaimMessage = generateReclaimMessage(walletAddress);
    setMessage(reclaimMessage);
    setStep('sign');
  };

  const handleSign = async () => {
    if (!message) return;

    try {
      setStep('reclaiming');
      
      const signature = await signMessage(message);
      if (!signature) {
        toast.error('Message signing was cancelled');
        setStep('sign');
        return;
      }

      const success = await reclaimWallet(walletAddress, signature, message);
      if (success) {
        toast.success('Wallet reclaimed successfully!');
        onSuccess?.();
        onOpenChange(false);
        setStep('confirm');
      } else {
        setStep('sign');
      }
    } catch (error) {
      console.error('Reclaim error:', error);
      toast.error('Failed to reclaim wallet');
      setStep('sign');
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('confirm');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Reclaim Wallet
          </DialogTitle>
          <DialogDescription>
            This wallet is linked to a previous account. You can reclaim it by proving ownership.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'confirm' && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Wallet:</strong> {walletAddress}</p>
                    <p>This will remove the wallet from the previous account and link it to your current account.</p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• You must have access to this wallet</li>
                  <li>• You'll need to sign a message to prove ownership</li>
                  <li>• The wallet will be completely transferred to your account</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleProceed}>
                  Proceed to Sign
                </Button>
              </div>
            </>
          )}

          {step === 'sign' && (
            <>
              <Alert>
                <AlertDescription>
                  Please sign this message with your wallet to prove ownership:
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-mono break-all">{message}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyMessage}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSign}>
                  Sign Message
                </Button>
              </div>
            </>
          )}

          {step === 'reclaiming' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">Reclaiming wallet...</p>
                <p className="text-sm text-muted-foreground">
                  Processing your request, please wait.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};