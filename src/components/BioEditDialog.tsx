import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentWalletButton } from '@/components/PaymentWalletButton';
import { DollarSign, Coins } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface ProfileLike {
  wallet_address: string;
  bio?: string;
}

interface BioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileLike | null | undefined;
  onConfirm: (bio: string) => Promise<boolean>;
  loading?: boolean;
  currentBio?: string;
}

export function BioEditDialog({ open, onOpenChange, profile, onConfirm, loading, currentBio }: BioEditDialogProps) {
  const [bio, setBio] = useState('');
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00); // 2 USDT for bio
  const { connected, openWalletSelector } = useSolanaWallet();
  
  const isFirstChange = !profile?.bio;

  // Pre-populate with current bio when dialog opens
  useEffect(() => {
    if (open) {
      setBio(currentBio || '');
    }
  }, [open, currentBio]);

  const handleConfirm = async () => {
    if (!bio.trim()) return;
    const success = await onConfirm(bio.trim());
    if (success) {
      onOpenChange(false);
      setBio('');
    }
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={(o) => { 
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setBio(currentBio || '');
        }
      }
    }}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isFirstChange ? 'Add Your Bio' : 'Update Bio'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={150}
              className="resize-none min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/150 characters
            </p>
          </div>

          {/* Pricing Alert */}
          {isFirstChange ? (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                Your first bio is <strong>FREE</strong>
              </AlertDescription>
            </Alert>
           ) : (
            <Alert className="bg-primary/10 border-primary/30 text-primary">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                Your first bio was <strong>FREE</strong>. Further changes require payment in ANIME at live rates (~2.00 USDT). Connect your wallet to continue.
              </AlertDescription>
            </Alert>
          )}

          {isFirstChange ? (
            <Button
              onClick={handleConfirm}
              disabled={!bio.trim() || loading}
              className="w-full"
            >
              {loading ? 'Setting...' : 'Set Bio (FREE)'}
            </Button>
          ) : (
            <PaymentWalletButton
              onPaymentComplete={async (txSignature) => {
                await handleConfirm();
              }}
              disabled={!bio.trim() || loading || (connected && pricingLoading)}
              amount={animeAmount}
              currency="ANIME"
            >
              {loading ? 'Updating...' : 
               pricingLoading ? 'Calculating Price...' :
               `Pay ${animeAmount.toLocaleString()} ANIME & Update Bio`}
            </PaymentWalletButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}