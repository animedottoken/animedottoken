
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useCollections } from "@/hooks/useCollections";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Edit, Settings, BarChart3, Wallet, ExternalLink, User, Grid3X3, Clock, Plus, Trash2, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { getCollectionDescription } from "@/types/collection";
import { useUserActivity } from "@/hooks/useUserActivity";
import { useMintQueue } from "@/hooks/useMintQueue";
import { MintQueueStatus } from "@/components/MintQueueStatus";
import { CollectionEditor } from "@/components/CollectionEditor";
import { useUserNFTs } from "@/hooks/useUserNFTs";
import { useBurnNFT } from "@/hooks/useBurnNFT";
import { useDeleteCollection } from "@/hooks/useDeleteCollection";
import { useBurnAllNFTs } from "@/hooks/useBurnAllNFTs";
import { useCollectionMints } from "@/hooks/useCollectionMints";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useFavorites } from "@/hooks/useFavorites";

export default function Profile() {
  const { connected, publicKey } = useSolanaWallet();
  const { collections, loading: collectionsLoading, refreshCollections } = useCollections();
  const { nfts, loading: nftsLoading, refreshNFTs } = useUserNFTs();
  const { burning, burnNFT } = useBurnNFT();
  const { deleting, deleteCollection } = useDeleteCollection();
  const { burning: burningAll, burnAllNFTs } = useBurnAllNFTs();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'collections';

  // Auto-refresh collections when component mounts
  useEffect(() => {
    if (connected && publicKey) {
      console.log('Auto-refreshing collections for wallet:', publicKey);
      refreshCollections();
    }
  }, [connected, publicKey, refreshCollections]);

  const handleRefresh = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    toast.info('Refreshing collections...');
    await refreshCollections();
    toast.success('Collections refreshed!');
  };

  const handleBurnNFT = async (nftId: string, mintAddress: string) => {
    const result = await burnNFT(nftId, mintAddress);
    if (result.success) {
      // Refresh the NFTs list to remove the burned NFT
      refreshNFTs();
    }
  };

  const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
    const result = await deleteCollection(collectionId, collectionName);
    if (result.success) {
      // Refresh the collections list to remove the deleted collection
      refreshCollections();
    }
  };

  const handleBurnAllNFTs = async (collectionId: string, collectionName: string) => {
    const result = await burnAllNFTs(collectionId);
    if (result.success && result.burned > 0) {
      // Refresh both collections and NFTs lists
      refreshCollections();
      refreshNFTs();
      toast.success(`All NFTs in "${collectionName}" have been burned! Collection is now ready to burn.`);
    }
  };

  // Helper function to get NFT count for a collection
  const getCollectionNFTCount = (collectionId: string) => {
    return nfts.filter(nft => nft.collection_id === collectionId).length;
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your profile and collections.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedCollection) {
    const isOwner = publicKey === (selectedCollection as any)?.creator_address;
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedCollection(null)}
            className="mb-4"
          >
            ← Back to Profile
          </Button>
        </div>
        {isOwner && (
          <CollectionEditor 
            collection={selectedCollection} 
            onClose={() => setSelectedCollection(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <p className="text-muted-foreground">
                  {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Not connected'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Devnet - Testing Mode
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger value="nfts" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My NFTs ({nfts.length})
          </TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Collections</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={collectionsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${collectionsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild size="sm">
                <Link to="/mint/collection">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Collection
                </Link>
              </Button>
            </div>
          </div>

          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Grid3X3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first NFT collection to get started.
                </p>
                <Button asChild>
                  <Link to="/mint/collection">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Collection
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
                    <img
                      src={collection.image_url || collection.banner_image_url || "/placeholder.svg"}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== "/placeholder.svg") {
                          img.src = "/placeholder.svg";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2 flex-wrap justify-center">
                        <Button
                          size="sm"
                          onClick={() => setSelectedCollection(collection)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/collection/${collection.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          asChild
                        >
                          <Link to={`/mint/nft?collection=${collection.id}`}>
                            <Plus className="h-4 w-4 mr-1" />
                            Mint
                          </Link>
                        </Button>
                        {(collection.items_redeemed || 0) === 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={deleting}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Burn Collection
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Burn Collection</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to burn "{collection.name}"? This action cannot be undone and will permanently remove the collection from the blockchain.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteCollection(collection.id, collection.name)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          disabled={deleting}
                                        >
                                          {deleting ? 'Burning...' : 'Burn Collection'}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ready to burn - no NFTs in this collection</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={burningAll}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Burn NFTs
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Burn All NFTs</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will burn all {collection.items_redeemed} NFTs in "{collection.name}". After burning all NFTs, you'll be able to burn the collection itself. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleBurnAllNFTs(collection.id, collection.name)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          disabled={burningAll}
                                        >
                                          {burningAll ? 'Burning NFTs...' : `Burn ${collection.items_redeemed} NFTs`}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Burn all NFTs first, then you can burn the collection</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{collection.name}</h4>
                      <div className="flex items-center gap-1">
                        {collection.is_live ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Badge variant="default" className="bg-green-500 text-white text-xs">
                                  Live
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Collection is live and accepting mints</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Badge variant="secondary" className="text-xs">
                                  Draft
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Collection is in draft mode</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {collection.verified && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  ✓
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Verified collection</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Heart clicked for collection:', collection.id);
                                const favoriteData = {
                                  id: collection.id,
                                  name: collection.name,
                                  image_url: collection.image_url || collection.banner_image_url,
                                  type: 'collection' as const
                                };
                                
                                if (isFavorite(collection.id)) {
                                  console.log('Removing from favorites');
                                  removeFromFavorites(collection.id);
                                } else {
                                  console.log('Adding to favorites');
                                  addToFavorites(favoriteData);
                                }
                              }}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  isFavorite(collection.id) 
                                    ? 'fill-current text-red-500' 
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {!connected 
                                ? 'Connect wallet to use favorites'
                                : isFavorite(collection.id) 
                                  ? 'Remove from favorites' 
                                  : 'Add to favorites'
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {getCollectionDescription(collection)}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Supply:</span>
                        <span className="ml-1 font-medium">
                          {collection.supply_mode === 'open' ? '∞' : collection.max_supply?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Minted:</span>
                        <span className="ml-1 font-medium">{collection.items_redeemed || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <span className="ml-1 font-medium text-green-600">
                          {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Royalty:</span>
                        <span className="ml-1 font-medium">{collection.royalty_percentage || 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My NFTs Tab */}
        <TabsContent value="nfts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My NFTs</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNFTs}
                disabled={nftsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${nftsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild size="sm">
                <Link to="/mint/nft">
                  <Plus className="h-4 w-4 mr-2" />
                  Mint NFT
                </Link>
              </Button>
            </div>
          </div>

          {nftsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : nfts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Mint your first NFT to get started.
                </p>
                <Button asChild>
                  <Link to="/mint/nft">
                    <Plus className="h-4 w-4 mr-2" />
                    Mint Your First NFT
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <Card key={nft.id} className="group hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-muted relative">
                    <img
                      src={nft.image_url || "/placeholder.svg"}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (img.src !== "/placeholder.svg") {
                          img.src = "/placeholder.svg";
                        }
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{nft.name}</h4>
                      <div className="flex items-center gap-2">
                        {nft.symbol && (
                          <Badge variant="outline" className="text-xs">
                            {nft.symbol}
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Burn NFT</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to burn "{nft.name}"? This action permanently destroys the NFT from the blockchain and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBurnNFT(nft.id, nft.mint_address || '')}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={burning}
                              >
                                {burning ? 'Burning...' : 'Burn NFT'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {nft.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {nft.description}
                      </p>
                    )}
                    {nft.collection_name && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Collection:</span>
                        <span className="ml-1 font-medium">{nft.collection_name}</span>
                      </div>
                    )}
                    {nft.metadata && Array.isArray(nft.metadata) && nft.metadata.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Properties:</div>
                        <div className="flex flex-wrap gap-1">
                          {nft.metadata.slice(0, 3).map((attr: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {attr.trait_type}: {attr.value}
                            </Badge>
                          ))}
                          {nft.metadata.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{nft.metadata.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Minted: {new Date(nft.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
