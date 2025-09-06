import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/ui/file-upload';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
import { Info, Coins } from 'lucide-react';

interface CollectionBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentUrl?: string;
  onSaved: () => void;
  isMinted?: boolean; // Whether any NFTs have been minted
}

export const CollectionBannerDialog = ({
  open,
  onOpenChange,
  collectionId,
  currentUrl,
  onSaved,
  isMinted = false
}: CollectionBannerDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const requiredUSDT = 0.00004; // ~1 ANIME for testing
  const { animeAmount: requiredANIME, animePrice, loading: priceLoading } = useAnimePricing(requiredUSDT);
  const { publicKey } = useSolanaWallet();

  // Set current banner as preview when dialog opens
  useEffect(() => {
    if (open && currentUrl && !selectedFile) {
      setPreviewUrl(currentUrl);
    }
  }, [open, currentUrl, selectedFile]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(currentUrl || '');
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }


    try {
      setUploading(true);

      // Upload to Supabase Storage with cache-busting timestamp
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${collectionId}-banner-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('collection-images')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('collection-images')
        .getPublicUrl(fileName);

      // Prepare update payload
      const updatePayload: any = {
        collection_id: collectionId,
        updates: {
          banner_image_url: publicUrl
        }
      };

      // Add payment data if required
      if (isMinted) {
        updatePayload.payment = {
          tx_signature: 'simulated_banner_transaction',
          amount_usdt: requiredUSDT,
          amount_anime: requiredANIME,
          anime_price: animePrice
        };
      }

      // Update collection
      const { error: updateError } = await supabase.functions.invoke('update-collection', {
        body: updatePayload,
        headers: {
          'X-Wallet-Address': publicKey || 'unknown'
        }
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Banner updated successfully');
      onSaved();
      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setPaymentConfirmed(false);
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { 
      if (!uploading) {
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
          <DialogTitle>Change Collection Banner</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="space-y-4">
            {/* Single Banner Preview/Upload Area */}
            <div>
              <h3 className="text-sm font-medium mb-2">Banner Preview</h3>
              <AspectRatio ratio={21/9} className="bg-muted rounded-lg overflow-hidden border relative group">
                <img 
                  src={previewUrl || currentUrl || '/placeholder.svg'} 
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
                <strong>Recommended:</strong> 1200x300px (4:1 ratio) for best quality. This banner will be visible on your collection page.
              </AlertDescription>
            </Alert>


            {/* Pricing Alert */}
            {isMinted && (
              <Alert className="bg-primary/10 border-primary/30 text-primary">
                <Coins className="h-4 w-4" />
                <AlertDescription>
                  Banner change requires payment in ANIME. Price updates live from DexScreener (~2.00 USDT).
                </AlertDescription>
              </Alert>
            )}

          </div>
        </div>

        <div className="p-6 pt-0 space-y-4">
          {isMinted && (
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
          )}
          
          <Button
            className="w-full"
            disabled={!selectedFile || uploading || (isMinted && !paymentConfirmed) || priceLoading}
            onClick={handleConfirm}
          >
            {uploading ? 'Updating...' : 
             priceLoading ? 'Calculating Price...' :
             isMinted ? `Confirm & Pay ${requiredANIME.toLocaleString()} ANIME` : 'Save Banner'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};