
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, DollarSign, Users, Info, Trash2 } from 'lucide-react';
import { Collection, useCollections } from '@/hooks/useCollections';
import { FlexibleFieldEditor } from './FlexibleFieldEditor';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { useCollection } from '@/hooks/useCollection';
import { useDeleteCollection } from '@/hooks/useDeleteCollection';
import { useBurnAllNFTs } from '@/hooks/useBurnAllNFTs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface CollectionEditorProps {
  collection: Collection;
  onClose: () => void;
}

export const CollectionEditor = ({ collection: initialCollection, onClose }: CollectionEditorProps) => {
  const { updateCollection } = useCollections({ autoLoad: false });
  const { publicKey } = useSolanaWallet();
  const { collection, refreshCollection } = useCollection(initialCollection.id);
  const { deleting, deleteCollection } = useDeleteCollection();
  const { burning: burningAll, burnAllNFTs } = useBurnAllNFTs();
  
  // Use refreshed collection data if available, otherwise fallback to initial
  const currentCollection = collection || initialCollection;
  
  const isOwner = publicKey === currentCollection.creator_address;
  const itemsRedeemed = currentCollection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;

  const handleUpdate = async (updates: any) => {
    await updateCollection(currentCollection.id, updates);
    // Refresh the collection data after successful update
    refreshCollection();
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
      refreshCollection(); // Refresh to show updated NFT count
      toast.success(`All NFTs burned! Collection is now ready to burn.`);
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">View Only</h3>
            <p className="text-muted-foreground">
              You can only view this collection's details. Only the creator can make changes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Collection Settings
            </div>
            <div className="flex gap-2">
              <Badge variant={currentCollection.is_live ? 'default' : 'secondary'}>
                {currentCollection.is_live ? 'Live' : 'Draft'}
              </Badge>
              {hasMintedNFTs && (
                <Badge variant="outline">
                  {itemsRedeemed} NFTs Minted
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">
                {currentCollection.supply_mode === 'open' ? '∞' : currentCollection.max_supply?.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentCollection.supply_mode === 'open' ? 'Open Edition' : 'Max Supply'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{currentCollection.mint_price} SOL</div>
              <div className="text-sm text-muted-foreground">Mint Price</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Image className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{itemsRedeemed}</div>
              <div className="text-sm text-muted-foreground">Minted</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Settings className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{currentCollection.royalty_percentage}%</div>
              <div className="text-sm text-muted-foreground">Royalties</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Details Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit your collection settings. Some fields may be locked based on minting status or your preferences.
          </p>
        </CardHeader>
        <CardContent>
          <FlexibleFieldEditor
            collection={currentCollection}
            onUpdate={handleUpdate}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      {/* Burn Collection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Burn Collection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently destroy this collection. This action cannot be undone.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasMintedNFTs ? (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  This collection has {itemsRedeemed} minted NFTs. You must burn all NFTs before you can burn the collection.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={burningAll}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {burningAll ? 'Burning NFTs...' : `Burn All ${itemsRedeemed} NFTs`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Burn All NFTs</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently burn all {itemsRedeemed} NFTs in "{currentCollection.name}". 
                      After this, you'll be able to burn the collection itself. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBurnAllNFTs}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={burningAll}
                    >
                      {burningAll ? 'Burning...' : `Burn ${itemsRedeemed} NFTs`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ This collection is ready to burn. No NFTs are minted in this collection.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={deleting}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Burning Collection...' : 'Burn Collection'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Burn Collection</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently burn "{currentCollection.name}"? 
                      This action cannot be undone and will remove the collection from the blockchain.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCollection}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleting}
                    >
                      {deleting ? 'Burning...' : 'Burn Collection'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
