import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Wallet, TrendingUp, Activity, LogOut, ExternalLink, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useNFTs } from "@/hooks/useNFTs";
import { useCollections } from "@/hooks/useCollections";

export default function Profile() {
  const { connected, publicKey, disconnect } = useSolanaWallet();
  const { nfts, loading: nftsLoading } = useNFTs();
  const { collections } = useCollections();

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


  const userStats = {
    nftsOwned: nfts.length,
    totalValue: nfts.reduce((sum, nft) => sum + (nft.price || 0), 0).toFixed(2) + " SOL",
    totalSales: "0 SOL", // This would need transaction history
    collections: collections.length,
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
          {connected ? (
            <>
              {/* Profile Header */}
              <div className="relative mb-8">
                {/* Compact Header */}
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
              <Tabs defaultValue="collection" className="mb-8">
                <TabsList className="grid w-full grid-cols-4 lg:w-96">
                  <TabsTrigger value="collection">Collection</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="offers">Offers</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>

                <TabsContent value="collection" className="mt-6">
                  {nftsLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[...Array(8)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-muted rounded-t-lg" />
                            <div className="p-4 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4" />
                              <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : nfts.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <div className="text-6xl mb-4">🖼️</div>
                        <h3 className="text-2xl font-semibold mb-4">No NFTs Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Start building your collection by minting your first NFT or purchasing from the marketplace.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button asChild>
                            <a href="/mint">Mint NFT</a>
                          </Button>
                          <Button variant="outline" asChild>
                            <a href="/marketplace">Browse Marketplace</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {nfts.map((nft, i) => (
                        <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                              {nft.image_url ? (
                                <img 
                                  src={nft.image_url} 
                                  alt={nft.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-16 h-16 text-muted-foreground" />
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {(nft as any).collections?.name || 'No Collection'}
                                  </p>
                                </div>
                                <Badge variant="secondary">Owned</Badge>
                              </div>
                              {nft.price && (
                                <div className="flex justify-between items-center mb-3">
                                  <div>
                                    <div className="text-sm text-muted-foreground">Price</div>
                                    <div className="font-bold">{nft.price} {nft.currency || 'SOL'}</div>
                                  </div>
                                  {nft.is_listed && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                      Listed
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <Button className="w-full" variant="outline">
                                {nft.is_listed ? 'Update Listing' : 'List for Sale'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

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
                      <div className="space-y-4">
                        {[
                          { type: "Minted", item: "Sakura Warrior #1234", price: "0.1 SOL", time: "2 hours ago" },
                          { type: "Listed", item: "Cyber Ninja #5678", price: "2.5 SOL", time: "1 day ago" },
                          { type: "Sold", item: "Magic Girl #9012", price: "1.8 SOL", time: "3 days ago" },
                          { type: "Bought", item: "Dragon Master #3456", price: "3.2 SOL", time: "1 week ago" },
                        ].map((activity, i) => (
                          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {activity.type === "Minted" && "🎨"}
                                {activity.type === "Listed" && "🏷️"}
                                {activity.type === "Sold" && "💰"}
                                {activity.type === "Bought" && "🛒"}
                              </div>
                              <div>
                                <div className="font-medium">{activity.type} {activity.item}</div>
                                <div className="text-sm text-muted-foreground">{activity.time}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{activity.price}</div>
                              <Badge variant={activity.type === "Sold" ? "default" : "secondary"} className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="offers" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💼</div>
                    <h3 className="text-xl font-semibold mb-2">No Active Offers</h3>
                    <p className="text-muted-foreground">
                      Offers made and received will appear here
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">❤️</div>
                    <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
                    <p className="text-muted-foreground">
                      NFTs you like will be saved here
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