import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';

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
}

export function PfpPickerDialog({ open, onOpenChange, profile, nfts = [], onConfirm, loading }: PfpPickerDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);

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
            <div className="text-sm text-muted-foreground mt-2">
              <div>First change is free. Next changes cost 2 USD.</div>
              <div className="mt-1">Pick any NFT you own. You’ll see the live preview here.</div>
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
        <div className="p-6 pt-0">
          <Button
            className="w-full"
            disabled={!selected || loading}
            onClick={async () => {
              if (!selected) return;
              const ok = await onConfirm(selected);
              if (ok) onOpenChange(false);
            }}
          >
            {loading ? 'Updating...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
