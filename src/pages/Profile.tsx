
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useCollections } from "@/hooks/useCollections";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Edit, Settings, BarChart3, Wallet, ExternalLink, User, Grid3X3, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { getCollectionDescription } from "@/types/collection";
import { useUserActivity } from "@/hooks/useUserActivity";
import { useMintQueue } from "@/hooks/useMintQueue";
import { MintQueueStatus } from "@/components/MintQueueStatus";
import { CollectionEditor } from "@/components/CollectionEditor";
import { useUserNFTs } from "@/hooks/useUserNFTs";
import { useBurnNFT } from "@/hooks/useBurnNFT";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Profile() {
  const { connected, publicKey } = useSolanaWallet();
  const { collections, loading: collectionsLoading, refreshCollections } = useCollections();
  const { nfts, loading: nftsLoading, refreshNFTs } = useUserNFTs();
  const { burning, burnNFT } = useBurnNFT();
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
        <CollectionEditor 
          collection={selectedCollection} 
          onClose={() => setSelectedCollection(null)} 
        />
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
                      <div className="flex gap-2">
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
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{collection.name}</h4>
                      <div className="flex gap-1">
                        {collection.is_live ? (
                          <Badge variant="default" className="bg-green-500 text-white text-xs">
                            Live
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Draft
                          </Badge>
                        )}
                        {collection.verified && (
                          <Badge variant="outline" className="text-xs">
                            ✓
                          </Badge>
                        )}
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
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                      </span>
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
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Burn
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to burn this NFT?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action permanently destroys "{nft.name}" from the blockchain. 
                                This cannot be undone and the NFT will be lost forever.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBurnNFT(nft.id, nft.mint_address || '')}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={burning}
                              >
                                {burning ? 'Burning...' : 'Burn NFT'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{nft.name}</h4>
                      {nft.symbol && (
                        <Badge variant="outline" className="text-xs">
                          {nft.symbol}
                        </Badge>
                      )}
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
                          {nft.metadata.slice(0, 3).map((attr: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
                            >
                              {attr.trait_type}: {attr.value}
                            </span>
                          ))}
                          {nft.metadata.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{nft.metadata.length - 3} more
                            </span>
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
