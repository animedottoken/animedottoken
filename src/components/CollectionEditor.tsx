
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, DollarSign, Users, Info, Trash2, Play, Pause, Flame, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { Collection, useCollections } from '@/hooks/useCollections';
import { FlexibleFieldEditor } from './FlexibleFieldEditor';
import { useSolanaWallet } from '@/contexts/MockSolanaWalletContext';
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
  onRefreshMints?: () => void;
  startInEditMode?: boolean;
}

export const CollectionEditor = ({ collection: initialCollection, onClose, mints, onRefreshCollection, onRefreshMints, startInEditMode = false }: CollectionEditorProps) => {
  const { updateCollection } = useCollections({ autoLoad: false });
  const { publicKey } = useSolanaWallet();
  const { collection, refreshCollection } = useCollection(initialCollection.id);
  const { deleting, deleteCollection } = useDeleteCollection();
  const { burning: burningAll, burnAllNFTs } = useBurnAllNFTs();
  
  // State to control editing mode
  const [isExpanded, setIsExpanded] = useState(startInEditMode);
  
  // Always use the passed collection data for consistency
  // The parent component handles data refreshing
  const currentCollection = initialCollection;
  
  // Check ownership using the initial collection data to avoid masked creator_address from secured API
  const isOwner = publicKey === initialCollection.creator_address;
  const itemsRedeemed = currentCollection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;
  const isCollectionMinted = Boolean(currentCollection.collection_mint_address);
  const hasNFTsInUnmintedCollection = !isCollectionMinted && itemsRedeemed > 0;

  // State for cleanup operations
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const handleUpdate = async (updates: any) => {
    try {
      await updateCollection(currentCollection.id, updates);
      
      // Always refresh but silently to prevent page jumping
      onRefreshCollection();
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

  const handleCleanupNFTs = async (action: 'detach' | 'delete') => {
    if (cleanupLoading) return;
    
    setCleanupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-unminted-collection-nfts', {
        body: {
          collection_id: currentCollection.id,
          action
        }
      });

      if (error) {
        toast.error(`Failed to ${action} NFTs: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success(data.message);
        onRefreshCollection(); // Refresh to show updated counts
        onRefreshMints?.(); // Refresh mints to update the grid
        
        if (data.errors && data.errors.length > 0) {
          console.warn('Some operations had errors:', data.errors);
          toast.warning(`${action === 'detach' ? 'Detached' : 'Deleted'} ${data.processed} NFTs, but ${data.errors.length} had errors. Check console for details.`);
        }
      } else {
        toast.error(data?.error || `Failed to ${action} NFTs`);
      }
    } catch (error) {
      console.error(`Cleanup ${action} error:`, error);
      toast.error(`Failed to ${action} NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Unminted Collection with NFTs Warning */}
      {hasNFTsInUnmintedCollection && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Info className="h-5 w-5" />
              Collection Data Needs Cleanup
            </CardTitle>
            <p className="text-sm text-orange-700">
              This collection has {itemsRedeemed} NFTs but hasn't been minted on-chain yet. 
              In Solana, NFTs should only exist in collections that are minted on-chain.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-orange-700 font-medium">
                Choose how to handle existing NFTs:
              </p>
               <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCleanupNFTs('detach')}
                  disabled={cleanupLoading}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  {cleanupLoading ? 'Processing...' : 'Detach NFTs to Standalone'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={cleanupLoading}
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  Delete NFTs (Dangerous)
                </Button>
              </div>
              <p className="text-xs text-orange-600">
                <strong>Recommended:</strong> Detach NFTs to make them standalone. This preserves user assets and trading history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete All NFTs?"
        description={`This will permanently delete all ${itemsRedeemed} NFTs in this collection. This action cannot be undone.`}
        confirmText="Delete NFTs"
        variant="destructive"
        onConfirm={() => {
          handleCleanupNFTs('delete');
          setShowDeleteConfirm(false);
        }}
        loading={cleanupLoading}
      />
      
      {/* Collection Details Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Collection Details
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Collection information and settings. Click "Settings" to modify.
          </p>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {/* Legend Section */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-normal mb-3">Data Storage & Editability Legend</h4>
              <div className="flex flex-wrap gap-6 overflow-x-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Badge variant="onchain">On-Chain</Badge>
                  <span>Stored permanently on blockchain</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Badge variant="offchain">Off-Chain</Badge>
                  <span>Stored in app database, editable</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Badge variant="chainlocked">Chain Locked</Badge>
                  <span>Collection is minted on-chain</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Badge variant="locked">Creator Locked</Badge>
                  <span>Locked by you for safety</span>
                </div>
              </div>
            </div>
            
            <FlexibleFieldEditor
              collection={currentCollection}
              onUpdate={handleUpdate}
              isOwner={isOwner}
            />
            
            {/* Dangerous Actions Section */}
            <div className="mt-8 pt-6 border-t border-destructive/20">
              <h4 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Dangerous Actions
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                These actions cannot be undone. Please be careful.
              </p>
              
              <div className="space-y-4">
                {/* Collection Status Controls */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <h5 className="font-medium">Collection Status</h5>
                    <p className="text-sm text-muted-foreground">
                      {currentCollection.is_live ? 'Collection is live - users can mint' : 'Collection is paused - minting disabled'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handlePauseStart}
                    className={currentCollection.is_live ? "border-orange-500 text-orange-700 hover:bg-orange-50" : "border-green-500 text-green-700 hover:bg-green-50"}
                  >
                    {currentCollection.is_live ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Minting
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Go Live
                      </>
                    )}
                  </Button>
                </div>

                {/* Burn All NFTs */}
                {hasMintedNFTs && (
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <h5 className="font-medium text-destructive">Burn All NFTs</h5>
                      <p className="text-sm text-muted-foreground">
                        Permanently destroy all {itemsRedeemed} minted NFTs in this collection
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={burningAll}
                        >
                          <Flame className="w-4 h-4 mr-2" />
                          {burningAll ? 'Burning...' : 'Burn All NFTs'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Burn All NFTs?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently destroy all {itemsRedeemed} NFTs in "{currentCollection.name}". 
                            This action cannot be undone and will remove the NFTs from the blockchain forever.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBurnAllNFTs}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Burn All NFTs
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Delete Collection */}
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <h5 className="font-medium text-destructive">Delete Collection</h5>
                    <p className="text-sm text-muted-foreground">
                      {hasMintedNFTs 
                        ? 'Cannot delete collection with minted NFTs. Burn all NFTs first.'
                        : 'Permanently delete this collection from the platform'}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={deleting || hasMintedNFTs}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete Collection'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the collection "{currentCollection.name}". 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteCollection}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete Collection
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  );
};
