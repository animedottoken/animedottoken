import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, DollarSign, Coins, Info } from 'lucide-react';
import { useAnimePricing } from '@/hooks/useAnimePricing';

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
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { animeAmount, loading: pricingLoading } = useAnimePricing(2.00);

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
      setPaymentConfirmed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!loading) {
        onOpenChange(o);
        if (!o) {
          setSelectedFile(null);
          setPreviewUrl('');
          setPaymentConfirmed(false);
        }
      }
    }}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Update Your Profile Banner</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="space-y-4">
            {/* Single Banner Preview/Upload Area */}
            <div>
              <h3 className="text-sm font-medium mb-2">Banner Preview</h3>
              <AspectRatio ratio={4 / 1} className="bg-muted rounded-lg overflow-hidden border relative group">
                <img 
                  src={previewUrl || profile?.banner_image_url || '/placeholder.svg'} 
                  alt="Banner preview" 
                  className="w-full h-full object-cover"
                />
                
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
                    <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-medium text-gray-900">
                      Click to change banner
                    </div>
                  </div>
                </div>

                {/* Current file indicator */}
                {selectedFile && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    New image selected
                  </div>
                )}
              </AspectRatio>
              
              {/* File info */}
              {selectedFile && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                </div>
              )}
            </div>

            {/* Guidelines */}
            <Alert className="bg-blue-50 border-blue-200 text-blue-700">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended:</strong> 1200x300px (4:1 ratio) for best quality. This banner will be visible on your profile and marketplace listings.
              </AlertDescription>
            </Alert>

            {/* Pricing Alert */}
            <Alert className="bg-primary/10 border-primary/30 text-primary">
              <Coins className="h-4 w-4" />
              <AlertDescription>
                Banner change requires payment in ANIME. Price updates live from DexScreener (~2.00 USDT).
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <div className="p-6 pt-0 space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="banner-payment-confirmation"
              checked={paymentConfirmed}
              onCheckedChange={(checked) => setPaymentConfirmed(checked === true)}
            />
            <label 
              htmlFor="banner-payment-confirmation" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand I will be charged the amount shown for this banner change
            </label>
          </div>
          
          <Button
            className="w-full"
            disabled={!selectedFile || loading || !paymentConfirmed || pricingLoading}
            onClick={handleConfirm}
          >
            {loading ? 'Updating...' : 
             pricingLoading ? 'Calculating Price...' :
             `Confirm & Pay ${animeAmount.toLocaleString()} ANIME`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}