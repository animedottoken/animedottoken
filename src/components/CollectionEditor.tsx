
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Image, DollarSign, Users, Info, Trash2, Play, Pause, Flame, ChevronDown, ChevronUp, FileText } from 'lucide-react';
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
  startInEditMode?: boolean;
}

export const CollectionEditor = ({ collection: initialCollection, onClose, mints, onRefreshCollection, startInEditMode = false }: CollectionEditorProps) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="onchain">On-Chain</Badge>
                  <span className="font-normal">Stored permanently on blockchain</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="offchain">Off-Chain</Badge>
                  <span className="font-normal">Stored in app database, editable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="chainlocked">Chain Locked</Badge>
                  <span className="font-normal">Cannot change after first mint</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="locked">Creator Locked</Badge>
                  <span className="font-normal">Locked by you for safety</span>
                </div>
              </div>
            </div>
            
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
