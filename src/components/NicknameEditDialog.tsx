import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Coins } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';

interface ProfileLike {
  wallet_address: string;
  nickname?: string;
}

interface NicknameEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileLike | null | undefined;
  onConfirm: (nickname: string) => Promise<boolean>;
  loading?: boolean;
  currentNickname?: string;
}

export function NicknameEditDialog({ open, onOpenChange, profile, onConfirm, loading, currentNickname }: NicknameEditDialogProps) {
  const [nickname, setNickname] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { animeAmount, loading: pricingLoading } = useAnimePricing(1.00); // 1 USDT for nickname
  
  const isFirstChange = !profile?.nickname;

  // Pre-populate with current nickname when dialog opens
  useEffect(() => {
    if (open) {
      setNickname(currentNickname || '');
    }
  }, [open, currentNickname]);

  const handleConfirm = async () => {
    if (!nickname.trim()) return;
    const success = await onConfirm(nickname.trim());
    if (success) {
      onOpenChange(false);
      setNickname('');
      setPaymentConfirmed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setNickname(currentNickname || '');
          setPaymentConfirmed(false);
        }
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isFirstChange ? 'Set Your Nickname' : 'Change Nickname'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              2-20 characters. Letters, numbers, spaces, hyphens, underscores, and periods allowed.
            </p>
          </div>

          {/* Pricing Alert */}
          {isFirstChange ? (
            <Alert className="border-green-200 bg-green-50 text-green-700">
              <DollarSign className="h-4 w-4" />
              <AlertDescription>
                Your first nickname is <strong>FREE</strong>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-primary/10 border-primary/30 text-primary">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                Nickname change requires payment in ANIME. Price updates live from DexScreener (~1.00 USDT).
              </AlertDescription>
            </Alert>
          )}

          {!isFirstChange && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="nickname-payment-confirmation"
                checked={paymentConfirmed}
                onCheckedChange={(checked) => setPaymentConfirmed(checked === true)}
              />
              <label 
                htmlFor="nickname-payment-confirmation" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand I will be charged the amount shown for this nickname change
              </label>
            </div>
          )}
          
          <Button
            className="w-full"
            disabled={!nickname.trim() || loading || (!isFirstChange && !paymentConfirmed) || pricingLoading}
            onClick={handleConfirm}
          >
            {loading ? 'Updating...' : 
             isFirstChange ? 'Set Nickname (FREE)' : 
             pricingLoading ? 'Calculating Price...' :
             `Confirm & Pay ${animeAmount.toLocaleString()} ANIME`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}