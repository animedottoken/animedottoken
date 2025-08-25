import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAnimePricing } from '@/hooks/useAnimePricing';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

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
  const [uploading, setUploading] = useState(false);
  const [txSignature, setTxSignature] = useState('');
  
  const requiredUSDT = 2;
  const { animeAmount: requiredANIME, animePrice, loading: priceLoading } = useAnimePricing(requiredUSDT);
  const { publicKey } = useSolanaWallet();

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    if (isMinted && !txSignature.trim()) {
      toast.error('Payment transaction signature is required for banner changes after minting');
      return;
    }

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${collectionId}-banner.${fileExt}`;
      
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
          tx_signature: txSignature.trim(),
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
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTxSignature('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Collection Banner</DialogTitle>
          <DialogDescription>
            Upload a new banner image for your collection. This will be displayed at the top of your collection page.
            {isMinted && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400">
                ⚠️ Collection has minted NFTs. Banner changes now require a payment of 2 USDT in ANIME tokens.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <FileUpload
              onFileSelect={setSelectedFile}
              previewUrl={currentUrl}
              currentFile={selectedFile}
              placeholder="Click to upload banner"
              aspectRatio={21/9}
              maxSizeText="Maximum file size: 10MB"
            />
          </div>

          {isMinted && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment Required:</span>
                <div className="flex gap-2">
                  <Badge variant="outline">2 USDT</Badge>
                  <Badge variant="outline">
                    {priceLoading ? 'Loading...' : `${requiredANIME.toFixed(0)} ANIME`}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="txSignature">Payment Transaction Signature</Label>
                <Input
                  id="txSignature"
                  value={txSignature}
                  onChange={(e) => setTxSignature(e.target.value)}
                  placeholder="Enter Solana transaction signature..."
                  className="font-mono text-xs"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Send {requiredANIME.toFixed(0)} ANIME tokens (worth ~2 USDT) to the platform wallet and enter the transaction signature above.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || uploading || (isMinted && !txSignature.trim())}>
            {uploading ? 'Saving...' : 'Save Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};