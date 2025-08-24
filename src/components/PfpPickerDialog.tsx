import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Image as ImageIcon, AlertTriangle, DollarSign, Coins } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';

interface NFTItem {
  mint_address?: string;
  name: string;
  image_url?: string;
}

interface ProfileLike {
  wallet_address: string;
  nickname?: string;
  profile_image_url?: string;
}

interface PfpPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileLike | null | undefined;
  nfts: NFTItem[] | undefined;
  onConfirm: (mintAddress: string) => Promise<boolean>;
  loading?: boolean;
  isFirstChange?: boolean;
}

export function PfpPickerDialog({ open, onOpenChange, profile, nfts = [], onConfirm, loading, isFirstChange = true }: PfpPickerDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00);

  const selectedImage = useMemo(() => {
    if (!selected) return profile?.profile_image_url;
    return nfts.find(n => n.mint_address === selected)?.image_url || profile?.profile_image_url;
  }, [selected, nfts, profile?.profile_image_url]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Select an NFT for your profile picture</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-border shadow">
                <AvatarImage src={selectedImage || undefined} alt="Preview" />
                <AvatarFallback className="text-lg">
                  {profile?.nickname?.slice(0,2).toUpperCase() || profile?.wallet_address?.slice(0,2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm mt-2">
              <div className="text-muted-foreground mb-3">
                Pick any NFT you own. You'll see the live preview here.
              </div>
              
              {isFirstChange ? (
                <Alert className="border-green-200 bg-green-50 text-green-700">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Your first profile picture change is <strong>FREE</strong>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-primary/10 border-primary/30 text-primary">
                  <Coins className="h-4 w-4" />
                  <AlertDescription>
                    This change will cost <strong>{pricingLoading ? 'Calculating...' : `${animeAmount.toLocaleString()} ANIME`}</strong> (~$2.00 USD)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 max-h-[50vh] overflow-auto">
          {nfts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {nfts.filter(n => !!n.mint_address).map((nft) => (
                <button
                  key={nft.mint_address || nft.name}
                  onClick={() => nft.mint_address && setSelected(nft.mint_address)}
                  className={`relative rounded-lg overflow-hidden border aspect-square focus:outline-none transition-colors ${selected === nft.mint_address ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-foreground/20'}`}
                  title={nft.name}
                >
                  <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No NFTs found in your wallet.</p>
          )}
        </div>
        <div className="p-6 pt-0 space-y-4">
          {!isFirstChange && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="payment-confirmation"
                checked={paymentConfirmed}
                onCheckedChange={(checked) => setPaymentConfirmed(checked === true)}
              />
              <label 
                htmlFor="payment-confirmation" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that I will be charged <strong>{pricingLoading ? 'calculating...' : `${animeAmount.toLocaleString()} ANIME (~$2.00 USD)`}</strong> for this profile picture change
              </label>
            </div>
          )}
          
          <Button
            className="w-full"
            disabled={!selected || loading || (!isFirstChange && !paymentConfirmed) || pricingLoading}
            onClick={async () => {
              if (!selected) return;
              const ok = await onConfirm(selected);
              if (ok) onOpenChange(false);
            }}
          >
            {loading ? 'Updating...' : 
             isFirstChange ? 'Set Profile Picture (FREE)' : 
             pricingLoading ? 'Calculating Price...' :
             `Confirm & Pay ${animeAmount.toLocaleString()} ANIME`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}