import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, ExternalLink, Settings, Wallet, TrendingUp, Activity, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { connected, publicKey, disconnect } = useSolanaWallet();

  // Random anime-style avatars
  const animeAvatars = [
    "🧙‍♀️", "🥷", "👺", "🎌", "⚔️", "🌸", "✨", "🔥", 
    "🐉", "🦋", "🌙", "⭐", "💫", "🎭", "🎨", "🎪"
  ];
  
  const getRandomAvatar = () => {
    if (!publicKey) {
      console.log('No publicKey available for avatar');
      return "👤";
    }
    // Use wallet address to consistently pick same avatar
    const index = parseInt(publicKey.slice(-2), 16) % animeAvatars.length;
    const avatar = animeAvatars[index];
    console.log('Avatar selected:', avatar, 'for publicKey:', publicKey);
    return avatar;
  };

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

  const handleViewOnExplorer = () => {
    if (publicKey) {
      const url = `https://solscan.io/account/${publicKey}`;
      console.log('Opening Solscan URL:', url);
      try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Popup blocked, try another approach
          console.log('Popup blocked, trying location.href');
          window.location.href = url;
        }
      } catch (error) {
        console.error('Failed to open Solscan:', error);
        window.location.href = url;
      }
    } else {
      console.log('No publicKey available for Solscan');
    }
  };

  const userStats = {
    nftsOwned: 42,
    totalValue: "15.6 SOL",
    totalSales: "8.2 SOL",
    collections: 7,
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
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {getRandomAvatar()}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleViewOnExplorer}
                            title="View on Solscan"
                          >
                            <ExternalLink className="h-4 w-4" />
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="group cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                            {['🎌', '⚔️', '🌸', '🥷', '✨', '🧙‍♀️', '🌃', '🔥'][i % 8]}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold line-clamp-1">My NFT #{1000 + i}</h3>
                                <p className="text-sm text-muted-foreground">Anime Collection</p>
                              </div>
                              <Badge variant="secondary">Owned</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm text-muted-foreground">Floor Price</div>
                                <div className="font-bold">{(0.5 + Math.random() * 3).toFixed(1)} SOL</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{Math.floor(Math.random() * 30 + 5)}%
                              </Badge>
                            </div>
                            <Button className="w-full mt-3" variant="outline">
                              List for Sale
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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