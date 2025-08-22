
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, DollarSign, Users, Info } from 'lucide-react';
import { Collection, useCollections } from '@/hooks/useCollections';
import { FlexibleFieldEditor } from './FlexibleFieldEditor';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface CollectionEditorProps {
  collection: Collection;
  onClose: () => void;
}

export const CollectionEditor = ({ collection, onClose }: CollectionEditorProps) => {
  const { updateCollection } = useCollections({ autoLoad: false });
  const { publicKey } = useSolanaWallet();
  
  const isOwner = publicKey === collection.creator_address;
  const itemsRedeemed = collection.items_redeemed || 0;
  const hasMintedNFTs = itemsRedeemed > 0;

  const handleUpdate = async (updates: any) => {
    await updateCollection(collection.id, updates);
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
              <Badge variant={collection.is_live ? 'default' : 'secondary'}>
                {collection.is_live ? 'Live' : 'Draft'}
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
                {collection.supply_mode === 'open' ? '∞' : collection.max_supply?.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {collection.supply_mode === 'open' ? 'Open Edition' : 'Max Supply'}
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{collection.mint_price} SOL</div>
              <div className="text-sm text-muted-foreground">Mint Price</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Image className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{itemsRedeemed}</div>
              <div className="text-sm text-muted-foreground">Minted</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Settings className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">{collection.royalty_percentage}%</div>
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
            collection={collection}
            onUpdate={handleUpdate}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>
    </div>
  );
};
