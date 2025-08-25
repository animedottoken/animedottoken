import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CollectionBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentUrl?: string;
  onSaved: () => void;
}

export const CollectionBannerDialog = ({
  open,
  onOpenChange,
  collectionId,
  currentUrl,
  onSaved
}: CollectionBannerDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
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

      // Update collection
      const { error: updateError } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: collectionId,
          updates: {
            banner_image_url: publicUrl
          }
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Collection Banner</DialogTitle>
          <DialogDescription>
            Upload a new banner image for your collection. This will be displayed at the top of your collection page.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <FileUpload
            onFileSelect={setSelectedFile}
            previewUrl={currentUrl}
            currentFile={selectedFile}
            placeholder="Click to upload banner"
            aspectRatio={21/9}
            maxSizeText="Maximum file size: 10MB"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || uploading}>
            {uploading ? 'Saving...' : 'Save Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};