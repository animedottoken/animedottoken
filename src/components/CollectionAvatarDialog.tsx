import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CollectionAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentUrl?: string;
  onSaved: () => void;
  isMinted?: boolean; // Whether any NFTs have been minted
}

export const CollectionAvatarDialog = ({
  open,
  onOpenChange,
  collectionId,
  currentUrl,
  onSaved,
  isMinted = false
}: CollectionAvatarDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    if (isMinted) {
      toast.error('Avatar cannot be changed after NFTs are minted');
      return;
    }

    try {
      setUploading(true);

      // Upload to Supabase Storage with timestamp to bypass caching
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${collectionId}-avatar-${timestamp}.${fileExt}`;
      
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
            image_url: publicUrl
          }
        }
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Avatar updated successfully');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
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
          <DialogTitle>Change Collection Avatar</DialogTitle>
          <DialogDescription>
            Upload a new avatar image for your collection. This will be displayed as the collection's profile picture.
            {isMinted && (
              <span className="block mt-2 text-destructive">
                ⚠️ Avatar cannot be changed after NFTs are minted.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="w-48 h-48 bg-muted rounded-lg overflow-hidden border relative group mx-auto">
            <img 
              src={currentUrl || '/placeholder.svg'} 
              alt="Collection avatar preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <FileUpload
                onFileSelect={setSelectedFile}
                accept="image/*"
                currentFile={selectedFile}
                previewUrl={currentUrl}
                placeholder=""
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-lg px-3 py-2 text-sm font-medium text-gray-900">
                  Click to upload avatar
                </div>
              </div>
            </div>
            {selectedFile && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                New
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || uploading || isMinted}>
            {uploading ? 'Saving...' : 'Save Avatar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};