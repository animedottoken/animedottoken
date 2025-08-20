import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";
import { Copy, Wallet, Activity, LogOut, ExternalLink, Plus, Eye, Heart, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCollections } from "@/hooks/useCollections";
import { QuickNav } from "@/components/QuickNav";
import { useUserActivity } from "@/hooks/useUserActivity";
import { useFavorites } from "@/hooks/useFavorites";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'collections';
  
  const { connected, publicKey, disconnect } = useSolanaWallet();
  const { collections, loading: collectionsLoading } = useCollections();
  const { activities, loading: activitiesLoading } = useUserActivity();
  const { favorites, removeFromFavorites } = useFavorites();

  const displayName = 'ANIME Collector';
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.slice(0,2) || 'AN').toUpperCase();
  };
  const initials = getInitials(displayName);

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey);
        toast.success("Wallet address copied!");
      } catch (error) {
        toast.error("Failed to copy address");
      }
    }
  };

  // Calculate real stats
  const userStats = {
    nftsOwned: 0, // No NFTs minted yet
    totalValue: "0 SOL",
    totalSales: "0 SOL", 
    collections: collections.length,
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      art: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      photography: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      music: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      gaming: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      pfp: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      utility: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[category || 'other'] || colors.other;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'collection_created': return '🎨';
      case 'mint_job_created': return '⚡';
      case 'mint_completed': return '✅';
      case 'mint_failed': return '❌';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'failed': return 'bg-red-500 text-white';
      case 'processing': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <>
      <Helmet>
        <title>My Profile | Anime Token - Manage Your NFT Collection</title>
        <meta name="description" content="Manage your anime NFT collection, view portfolio stats, and track your digital assets on Solana blockchain." />
        <meta name="keywords" content="NFT profile, portfolio, Solana wallet, digital collectibles, anime NFT collection" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Quick Navigation */}
          <QuickNav className="mb-6 hidden md:flex" />
          
          {connected ? (
            <>
              {/* Profile Header */}
              <div className="relative mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-lg border">
                  <Avatar className="w-20 h-20 border-2 border-primary/20">
                    <AvatarFallback className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-2xl font-bold">ANIME Collector</h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Wallet className="h-4 w-4" />
                          <span className="font-mono text-sm">
                            {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCopyAddress}
                            title="Copy wallet address"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={disconnect}
                        className="flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect Wallet
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-background/50">
                        <CardContent className="text-center pt-4">
                          <div className="text-xl font-bold text-primary">{userStats.nftsOwned}</div>
                          <div className="text-xs text-muted-foreground">NFTs Owned</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-background/50">
                        <CardContent className="text-center pt-4">
                          <div className="text-xl font-bold text-primary">{userStats.totalValue}</div>
                          <div className="text-xs text-muted-foreground">Portfolio Value</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-background/50">
                        <CardContent className="text-center pt-4">
                          <div className="text-xl font-bold text-primary">{userStats.totalSales}</div>
                          <div className="text-xs text-muted-foreground">Total Sales</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-background/50">
                        <CardContent className="text-center pt-4">
                          <div className="text-xl font-bold text-primary">{userStats.collections}</div>
                          <div className="text-xs text-muted-foreground">Collections</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="mb-8">
                <TabsList className="grid w-full grid-cols-4 lg:w-96">
                  <TabsTrigger value="collections">Collections</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Collections Tab - Show user's created collections */}
                <TabsContent value="collections" className="mt-6">
                  {collectionsLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardHeader>
                            <div className="w-full h-48 bg-muted rounded-lg" />
                            <div className="h-6 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : collections.length === 0 ? (
                    <Card className="text-center py-16">
                      <CardContent>
                        <div className="text-6xl mb-4">📁</div>
                        <h3 className="text-2xl font-semibold mb-4">No Collections Created</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          Create your first collection to organize and showcase your NFTs.
                        </p>
                        <Button asChild size="lg">
                          <Link to="/mint">Create First Collection</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                     <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {collections.map((collection) => (
                        <Card key={collection.id} className="group hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="relative">
                              <AspectRatio ratio={3/1}>
                                {collection.banner_image_url ? (
                                  <img
                                    src={collection.banner_image_url}
                                    alt={`${collection.name} banner`}
                                    className="object-cover w-full h-full rounded-t-lg"
                                  />
                                ) : (
                                  <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 w-full h-full rounded-t-lg flex items-center justify-center">
                                    <div className="text-4xl opacity-50">🎨</div>
                                  </div>
                                )}
                              </AspectRatio>
                              
                              {/* Square Collection Avatar */}
                              <div className="absolute -bottom-6 left-4">
                                <div className="w-12 h-12 border-2 border-background rounded-lg overflow-hidden">
                                  {collection.image_url ? (
                                    <img
                                      src={collection.image_url}
                                      alt={`${collection.name} avatar`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs font-semibold">
                                      {collection.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Favorite Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                                onClick={() => {
                                  // Add favorite functionality here if needed
                                }}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="p-4 pt-8">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold line-clamp-1">{collection.name}</h3>
                                {collection.symbol && (
                                  <Badge variant="outline" className="text-xs">
                                    {collection.symbol}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {collection.description || "No description available"}
                              </p>
                              
                              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                                <div className="text-center">
                                  <div className="font-medium text-foreground">0</div>
                                  <div>Minted</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-foreground">{collection.max_supply || '∞'}</div>
                                  <div>Supply</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-foreground">{collection.mint_price || 0}</div>
                                  <div>Price</div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                  <Link to={`/collection/${collection.id}`}>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Details
                                  </Link>
                                </Button>
                                <Button size="sm" asChild className="flex-1">
                                  <Link to={`/mint?collection=${collection.slug || collection.id}`}>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create NFT
                                  </Link>
                                </Button>
                              </div>
                              
                              <div className="text-xs text-muted-foreground mt-2">
                                Created {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Create New Collection Tile */}
                      <Card className="group hover:shadow-lg transition-shadow border-dashed border-2 hover:border-primary/50">
                        <CardContent className="p-0">
                          <div className="aspect-[3/1] bg-gradient-to-br from-primary/5 to-accent/5 rounded-t-lg flex items-center justify-center">
                            <div className="text-4xl opacity-50">➕</div>
                          </div>
                          
                          <div className="p-4 pt-8 text-center">
                            <h3 className="font-semibold mb-2">Create Another Collection</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Organize your NFTs in themed collections
                            </p>
                            <Button asChild size="sm" className="w-full">
                              <Link to="/mint">
                                <Plus className="w-3 h-3 mr-2" />
                                Create New Collection
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Activity Tab - Show user's activities */}
                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Your latest transactions and activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activitiesLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                              <div className="w-10 h-10 bg-muted rounded-full" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : activities.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📝</div>
                          <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                          <p className="text-muted-foreground">
                            Your collection creation and minting activities will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div>
                                  <div className="font-medium">{activity.title}</div>
                                  <div className="text-sm text-muted-foreground">{activity.description}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.status && (
                                  <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                                    {activity.status}
                                  </Badge>
                                )}
                                {activity.price !== undefined && (
                                  <div className="text-sm font-medium mt-1">{activity.price} SOL</div>
                                )}
                                {activity.quantity && (
                                  <div className="text-xs text-muted-foreground">Qty: {activity.quantity}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Favorites Tab */}
                <TabsContent value="favorites" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Favorites ({favorites.length})
                      </CardTitle>
                      <CardDescription>
                        NFTs and collections you've favorited. 
                        <span className="block text-xs mt-1">
                          💡 Tip: Visit marketplace or collections and click the heart icon to add favorites
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {favorites.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">❤️</div>
                          <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Browse collections and NFTs to add them to your favorites
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button asChild variant="outline">
                              <Link to="/profile?tab=collections">Browse Collections</Link>
                            </Button>
                            <Button asChild>
                              <Link to="/marketplace">Visit Marketplace</Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {favorites.map((favorite) => (
                            <Card key={favorite.id} className="group hover:shadow-lg transition-shadow">
                              <CardContent className="p-0">
                                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center overflow-hidden">
                                  {favorite.image_url ? (
                                    <img 
                                      src={favorite.image_url} 
                                      alt={favorite.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-4xl">
                                      {favorite.type === 'collection' ? '📁' : '🖼️'}
                                    </div>
                                  )}
                                </div>
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold line-clamp-1">{favorite.name}</h3>
                                      {favorite.collection_name && (
                                        <p className="text-sm text-muted-foreground">{favorite.collection_name}</p>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromFavorites(favorite.id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {favorite.type === 'collection' ? 'Collection' : 'NFT'}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h3 className="text-xl font-semibold mb-2">Profile Settings</h3>
                    <p className="text-muted-foreground">
                      Profile customization and preferences will be available here soon
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="text-6xl mb-4">👤</div>
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  My Profile
                </h1>
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Connect your Solana wallet to view your NFT collection, track your portfolio, and manage your digital assets.
                </p>
                <SolanaWalletButton />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}