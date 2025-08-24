import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Coins } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';

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
  const [bio, setBio] = useState(currentBio || '');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00); // 2 USDT for bio
  
  const isFirstChange = !profile?.bio;

  const handleConfirm = async () => {
    if (!bio.trim()) return;
    const success = await onConfirm(bio.trim());
    if (success) {
      onOpenChange(false);
      setBio('');
      setPaymentConfirmed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setBio(currentBio || '');
          setPaymentConfirmed(false);
        }
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
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
              maxLength={100}
              className="resize-none min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/100 characters
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
                Bio change requires payment in ANIME. Price updates live from DexScreener (~2.00 USDT).
              </AlertDescription>
            </Alert>
          )}

          {!isFirstChange && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bio-payment-confirmation"
                checked={paymentConfirmed}
                onCheckedChange={(checked) => setPaymentConfirmed(checked === true)}
              />
              <label 
                htmlFor="bio-payment-confirmation" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand I will be charged the amount shown for this bio change
              </label>
            </div>
          )}
          
          <Button
            className="w-full"
            disabled={!bio.trim() || loading || (!isFirstChange && !paymentConfirmed) || pricingLoading}
            onClick={handleConfirm}
          >
            {loading ? 'Updating...' : 
             isFirstChange ? 'Set Bio (FREE)' : 
             pricingLoading ? 'Calculating Price...' :
             `Confirm & Pay ${animeAmount.toLocaleString()} ANIME`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}