
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, DollarSign, Users, Info, Trash2, Play, Pause, Flame } from 'lucide-react';
import { Collection, useCollections } from '@/hooks/useCollections';
import { FlexibleFieldEditor } from './FlexibleFieldEditor';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollection } from '@/hooks/useCollection';
import { useDeleteCollection } from '@/hooks/useDeleteCollection';
import { useBurnAllNFTs } from '@/hooks/useBurnAllNFTs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CollectionEditorProps {
  collection: Collection;
  onClose: () => void;
  mints: any[];
  onRefreshCollection: () => void;
}

export const CollectionEditor = ({ collection: initialCollection, onClose, mints, onRefreshCollection }: CollectionEditorProps) => {
  const { updateCollection } = useCollections({ autoLoad: false });
  const { publicKey } = useSolanaWallet();
  const { collection, refreshCollection } = useCollection(initialCollection.id);
  const { deleting, deleteCollection } = useDeleteCollection();
  const { burning: burningAll, burnAllNFTs } = useBurnAllNFTs();
  
  // State to control editing mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Always use the passed collection data for consistency
  // The parent component handles data refreshing
  const currentCollection = initialCollection;
  
  // Check ownership using the initial collection data to avoid masked creator_address from secured API
  const isOwner = publicKey === initialCollection.creator_address;
  const itemsRedeemed = currentCollection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;


  const handleUpdate = async (updates: any) => {
    try {
      await updateCollection(currentCollection.id, updates);
      // Notify parent to refresh data
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteCollection = async () => {
    const result = await deleteCollection(currentCollection.id, currentCollection.name);
    if (result.success) {
      toast.success('Collection burned successfully! 🔥');
      onClose(); // Close the editor and return to profile
    }
  };

  const handleBurnAllNFTs = async () => {
    const result = await burnAllNFTs(currentCollection.id);
    if (result.success && result.burned > 0) {
      onRefreshCollection(); // Refresh to show updated NFT count
      toast.success(`All NFTs burned! Collection is now ready to burn.`);
    }
  };

  const handlePauseStart = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('update-collection', {
        body: {
          collection_id: currentCollection.id,
          updates: { is_live: !currentCollection.is_live }
        }
      });
      
      if (data?.success) {
        onRefreshCollection();
        toast.success(
          currentCollection.is_live ? 'Collection paused' : 'Collection is now LIVE!',
          {
            description: currentCollection.is_live ? 'Minting has been paused' : 'Users can now mint NFTs'
          }
        );
      } else {
        toast.error('Failed to update collection status');
      }
    } catch (error) {
      toast.error('Failed to update collection status');
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Collection Details Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Collection Details
            </div>
            <div className="flex items-center gap-2">
              {/* Status Badges */}
              <div className="flex gap-2">
                <Badge variant={currentCollection.is_live ? 'default' : 'secondary'}>
                  {currentCollection.is_live ? 'Live' : 'Paused'}
                </Badge>
                {currentCollection.max_supply && (
                  <Badge variant="outline">
                    {mints.length}/{currentCollection.max_supply}
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-1">
                <Button
                  variant={currentCollection.is_live ? "warning" : "default"}
                  size="sm"
                  onClick={handlePauseStart}
                >
                  {currentCollection.is_live ? (
                    <><Pause className="w-3 h-3 mr-1" />Pause</>
                  ) : (
                    <><Play className="w-3 h-3 mr-1" />Start</>
                  )}
                </Button>
                
                <Button 
                  variant={isEditing ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                    >
                      <Flame className="w-3 h-3 mr-1" />
                      Burn
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {hasMintedNFTs ? 'Burn All NFTs' : 'Burn Collection'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {hasMintedNFTs 
                          ? `This will permanently burn all ${mints.length} NFTs in "${currentCollection.name}". This action cannot be undone.`
                          : `Are you sure you want to permanently burn "${currentCollection.name}"? This action cannot be undone and will remove the collection from the blockchain.`
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={hasMintedNFTs ? handleBurnAllNFTs : handleDeleteCollection}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={hasMintedNFTs ? burningAll : deleting}
                      >
                        {hasMintedNFTs 
                          ? (burningAll ? 'Burning...' : `Burn ${mints.length} NFTs`)
                          : (deleting ? 'Burning...' : 'Burn Collection')
                        }
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Edit your collection settings. Some fields may be locked based on minting status.'
              : 'Collection information and settings. Click Edit to modify.'
            }
          </p>
        </CardHeader>
        {isEditing && (
          <CardContent>
            <FlexibleFieldEditor
              collection={currentCollection}
              onUpdate={handleUpdate}
              isOwner={isOwner}
            />
          </CardContent>
        )}
      </Card>

    </div>
  );
};
