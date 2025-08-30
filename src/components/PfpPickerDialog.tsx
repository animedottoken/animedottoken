import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/ui/file-upload';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Checkbox } from '@/components/ui/checkbox';
import { PaymentWalletButton } from '@/components/PaymentWalletButton';
import { Image as ImageIcon, DollarSign, Coins, Info } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';

interface ProfileLike {
  wallet_address: string;
  nickname?: string;
  profile_image_url?: string;
}

interface PfpPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileLike | null | undefined;
  onConfirmUpload: (file: File) => Promise<boolean>;
  loading?: boolean;
  isFirstChange?: boolean;
}

export function PfpPickerDialog({ open, onOpenChange, profile, onConfirmUpload, loading, isFirstChange = true }: PfpPickerDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00);
  const { connected, openWalletSelector } = useSolanaWallet();

  // Set current avatar as preview when dialog opens
  useEffect(() => {
    if (open && profile?.profile_image_url && !selectedFile) {
      setPreviewUrl(profile.profile_image_url);
    }
  }, [open, profile?.profile_image_url, selectedFile]);

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
    const success = await onConfirmUpload(selectedFile);
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
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Update Your Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-40 h-40 sm:w-44 sm:h-44 border-4 border-border shadow">
                <AvatarImage src={previewUrl || profile?.profile_image_url || undefined} alt="Preview" />
                <AvatarFallback className="text-lg">
                  {profile?.nickname?.slice(0,2).toUpperCase() || profile?.wallet_address?.slice(0,2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
          
            <div className="flex-1 space-y-4">
              {/* Upload Area */}
              <div>
                <h3 className="text-sm font-medium mb-2">Select Image</h3>
                <div className="w-40 h-40 sm:w-44 sm:h-44 bg-muted rounded-lg overflow-hidden border relative group">
                  <img 
                    src={previewUrl || profile?.profile_image_url || '/placeholder.svg'} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Upload overlay when connected OR first change */}
                  {(connected || isFirstChange) ? (
                    <>
                      {/* Upload overlay */}
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
                          <div className="bg-white/90 rounded-lg px-3 py-2 text-xs font-medium text-gray-900">
                            Click to change
                          </div>
                        </div>
                      </div>

                      {/* Current file indicator */}
                      {selectedFile && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          New
                        </div>
                      )}
                    </>
                  ) : (
                    /* Wallet connection overlay when not connected AND not first change */
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-2">
                      <div className="text-center space-y-2 max-w-[160px]">
                        <p className="text-white text-xs font-medium">
                          Avatar updates require payment in ANIME (~2 USDT) at live rates.
                        </p>
                        <div className="text-white/90 text-xs">
                          Please connect your wallet to upload
                        </div>
                        <Button
                          onClick={openWalletSelector}
                          variant="default"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                        >
                          Connect Wallet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File info */}
                {selectedFile && (connected || isFirstChange) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <Alert className="bg-blue-50 border-blue-200 text-blue-700">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Recommended:</strong> 512x512px (1:1 ratio) for best quality. This avatar will be visible on your profile and marketplace.
                </AlertDescription>
              </Alert>

              {/* Pricing Alert */}
              {isFirstChange ? (
                <Alert className="border-green-200 bg-green-50 text-green-700">
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your first profile picture change is <strong>FREE</strong>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-primary/10 border-primary/30 text-primary">
                  <Coins className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your first profile picture was <strong>FREE</strong>. Further changes require payment in ANIME at live rates (~2.00 USDT). Connect your wallet to continue.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 space-y-4">
          {isFirstChange ? (
            <Button
              onClick={handleConfirm}
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? 'Setting...' : 'Set Profile Picture (FREE)'}
            </Button>
          ) : (
            <PaymentWalletButton
              onPaymentComplete={async (txSignature) => {
                if (selectedFile) {
                  await handleConfirm();
                }
              }}
              disabled={!selectedFile || loading || (connected && pricingLoading)}
              amount={animeAmount}
              currency="ANIME"
            >
               {loading ? 'Updating...' : 
                pricingLoading ? 'Calculating Price...' :
                `Pay ${animeAmount.toLocaleString()} ANIME (~2.00 USDT) & Update Picture`}
            </PaymentWalletButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}