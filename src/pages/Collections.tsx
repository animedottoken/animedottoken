import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { 
  Plus, 
  Image as ImageIcon, 
  Coins, 
  Users, 
  Calendar,
  Settings,
  Play,
  Pause,
  ExternalLink,
  Copy
} from "lucide-react";
import { CollectionCreator } from "@/components/CollectionCreator";
import { useCollections } from "@/hooks/useCollections";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { formatDistanceToNow } from "date-fns";
import { MintingInterface } from "@/components/MintingInterface";

export default function Collections() {
  const { connected } = useSolanaWallet();
  const { collections, loading, updateCollectionStatus } = useCollections();
  const [selectedTab, setSelectedTab] = useState<'browse' | 'create' | 'manage'>('browse');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const handleCollectionCreated = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setSelectedTab('manage');
  };

  const toggleCollectionLive = async (collectionId: string, isLive: boolean) => {
    await updateCollectionStatus(collectionId, { is_live: !isLive });
  };

  const copyCollectionId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  if (!connected) {
    return (
      <>
        <Helmet>
          <title>NFT Collections | Anime Token - Create & Manage Collections</title>
          <meta name="description" content="Create and manage your NFT collections on Solana blockchain. Design unique collections with custom properties and royalties." />
        </Helmet>
        
        <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Connect your Solana wallet to create and manage NFT collections.
              </p>
              <SolanaWalletButton />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>NFT Collections | Anime Token - Create & Manage Collections</title>
        <meta name="description" content="Create and manage your NFT collections on Solana blockchain. Design unique collections with custom properties and royalties." />
        <meta name="keywords" content="NFT collection creation, Solana NFT, collection management, NFT creator tools" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              NFT Collections
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create, manage, and launch your own NFT collections with complete control over properties, royalties, and minting rules.
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="browse">My Collections</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="manage">Mint</TabsTrigger>
            </TabsList>

            {/* Browse Collections */}
            <TabsContent value="browse" className="mt-8">
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your collections...</p>
                  </div>
                ) : collections.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-2xl font-semibold mb-2">No Collections Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        You haven't created any NFT collections yet. Start by creating your first collection!
                      </p>
                      <Button onClick={() => setSelectedTab('create')} size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Collection
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection) => (
                      <Card key={collection.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={collection.image_url}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{collection.name}</CardTitle>
                            <Badge variant={collection.is_live ? "default" : "secondary"}>
                              {collection.is_live ? "Live" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{collection.symbol}</span>
                            <span>•</span>
                            <span>{collection.items_redeemed} / {collection.max_supply} minted</span>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {collection.description}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                            <div>
                              <span className="text-muted-foreground">Price:</span>
                              <div className="font-medium">
                                {collection.mint_price === 0 ? 'FREE' : `${collection.mint_price} SOL`}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Royalties:</span>
                              <div className="font-medium">{collection.royalty_percentage}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Supply:</span>
                              <div className="font-medium">{collection.max_supply.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created:</span>
                              <div className="font-medium">
                                {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCollectionLive(collection.id, collection.is_live)}
                              className="flex-1"
                            >
                              {collection.is_live ? (
                                <>
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  Go Live
                                </>
                              )}
                            </Button>
                            
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedCollection(collection.id);
                                setSelectedTab('manage');
                              }}
                              className="flex-1"
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Manage
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Create Collection */}
            <TabsContent value="create" className="mt-8">
              <div className="flex justify-center">
                <CollectionCreator onCollectionCreated={handleCollectionCreated} />
              </div>
            </TabsContent>

            {/* Manage/Mint */}
            <TabsContent value="manage" className="mt-8">
              {selectedCollection ? (
                <div className="flex justify-center">
                  <MintingInterface collectionId={selectedCollection} />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-2xl font-semibold mb-2">Select a Collection</h3>
                    <p className="text-muted-foreground mb-6">
                      Choose a collection from your "My Collections" tab to manage and mint NFTs.
                    </p>
                    <Button onClick={() => setSelectedTab('browse')}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Browse Collections
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}