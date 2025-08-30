import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/ui/file-upload';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { PaymentWalletButton } from '@/components/PaymentWalletButton';
import { Coins, Info } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface ProfileLike {
  wallet_address: string;
  nickname?: string;
  banner_image_url?: string;
}

interface BannerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileLike | null | undefined;
  onConfirm: (file: File) => Promise<boolean>;
  loading?: boolean;
  isFirstChange?: boolean;
}

export function BannerPickerDialog({ open, onOpenChange, profile, onConfirm, loading, isFirstChange = true }: BannerPickerDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00);
  const { connected, connect } = useSolanaWallet();

  // Set current banner as preview when dialog opens
  useEffect(() => {
    if (open && profile?.banner_image_url && !selectedFile) {
      setPreviewUrl(profile.banner_image_url);
    }
  }, [open, profile?.banner_image_url, selectedFile]);

  // Create preview URL for selected file
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;
    const success = await onConfirm(selectedFile);
    if (success) {
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  return (
    <Dialog open={open} modal={false} onOpenChange={(o) => { 
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setSelectedFile(null);
          setPreviewUrl('');
        }
      }
    }}>
      <DialogContent 
        className="sm:max-w-[720px] p-0 overflow-hidden"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if wallet selector might be open
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent closing on outside interactions
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Allow escape to close, but only when not loading
          if (loading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Update Your Profile Banner</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4 space-y-4">
          {/* Single Banner Preview/Upload Area */}
          <div>
            <h3 className="text-sm font-medium mb-2">Banner Preview</h3>
            <AspectRatio ratio={4 / 1} className="bg-muted rounded-lg overflow-hidden border relative group">
              <img 
                src={previewUrl || profile?.banner_image_url || '/placeholder.svg'} 
                alt="Banner preview" 
                className="w-full h-full object-cover"
              />
              
              {connected ? (
                <>
                  {/* Upload overlay when connected */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/*"
                      currentFile={selectedFile}
                      previewUrl={previewUrl}
                      placeholder=""
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-medium text-gray-900">
                        Click to change banner
                      </div>
                    </div>
                  </div>

                  {/* Current file indicator */}
                  {selectedFile && (
                    <div className="absolute top-2 right-2 bg-success text-success-foreground px-2 py-1 rounded text-xs font-medium">
                      New image selected
                    </div>
                  )}
                </>
              ) : (
                /* Wallet connection overlay when not connected */
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                  <div className="text-center space-y-3 max-w-xs">
                    <p className="text-white/90 text-xs">
                      First upload is free. Future changes are a friendly, optional service (~2 USDT) at the live ANIME rate.
                    </p>
                    <div className="text-white text-sm font-medium">
                      Please connect your wallet to upload your banner
                    </div>
                    <Button
                      onClick={connect}
                      variant="default"
                      size="sm"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              )}
            </AspectRatio>
          
            {/* File info */}
            {selectedFile && connected && (
              <div className="mt-2 text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </div>
            )}
          </div>

          {/* Guidelines */}
          <Alert className="bg-blue-50 border-blue-200 text-blue-700">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommended:</strong> 1200x300px (4:1 ratio) for best quality. This banner will be visible on your profile and marketplace.
            </AlertDescription>
          </Alert>

          {/* Pricing Alert */}
          <Alert className="bg-primary/10 border-primary/30 text-primary">
            <Coins className="h-4 w-4" />
            <AlertDescription>
              Live pricing: we calculate the ANIME amount for ~2 USDT using the current rate from DexScreener.
            </AlertDescription>
          </Alert>
        </div>

        <div className="p-6 pt-0 space-y-4">
          <PaymentWalletButton
            onPaymentComplete={async (txSignature) => {
              if (selectedFile) {
                await handleConfirm();
              }
            }}
            disabled={!selectedFile || loading || pricingLoading}
            amount={animeAmount}
            currency="ANIME"
          >
            {loading ? 'Updating...' : 
             pricingLoading ? 'Calculating Price...' :
             `Pay ${animeAmount.toLocaleString()} ANIME & Update Banner`}
          </PaymentWalletButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}