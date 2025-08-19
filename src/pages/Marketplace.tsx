import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, Eye, Heart } from "lucide-react";

export default function Marketplace() {
  const { connected } = useSolanaWallet();

  // Mock NFT data for demonstration
  const featuredNFTs = [
    {
      id: 1,
      name: "Sakura Warrior #001",
      image: "🌸⚔️",
      price: "2.5 SOL",
      lastSale: "2.1 SOL",
      collection: "Anime Legends",
    },
    {
      id: 2,
      name: "Cyber Ninja #087",
      image: "🥷🌃",
      price: "1.8 SOL", 
      lastSale: "1.5 SOL",
      collection: "Future Warriors",
    },
    {
      id: 3,
      name: "Magic Girl #234",
      image: "🧙‍♀️✨",
      price: "3.2 SOL",
      lastSale: "2.8 SOL",
      collection: "Mystic Academy",
    },
  ];

  return (
    <>
      <Helmet>
        <title>NFT Marketplace | Anime Token - Buy, Sell & Trade Anime NFTs</title>
        <meta name="description" content="Discover, buy and sell exclusive anime NFTs on our Solana-powered marketplace. Low fees, instant transactions, vibrant community." />
        <meta name="keywords" content="NFT marketplace, anime NFT, Solana marketplace, buy NFT, sell NFT, digital collectibles" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                NFT Marketplace
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover, buy and sell exclusive anime NFTs
              </p>
            </div>
            <SolanaWalletButton />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">12.5K</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">3.2K</div>
                <div className="text-sm text-muted-foreground">Owners</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">0.1</div>
                <div className="text-sm text-muted-foreground">Floor (SOL)</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">847</div>
                <div className="text-sm text-muted-foreground">Volume (SOL)</div>
              </CardContent>
            </Card>
          </div>

          {connected ? (
            <>
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search NFTs, collections, or creators..."
                    className="pl-10"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="low">0.1 - 1 SOL</SelectItem>
                    <SelectItem value="mid">1 - 5 SOL</SelectItem>
                    <SelectItem value="high">5+ SOL</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Listed</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="all" className="mb-8">
                <TabsList className="grid w-full grid-cols-4 lg:w-96">
                  <TabsTrigger value="all">All NFTs</TabsTrigger>
                  <TabsTrigger value="featured">Featured</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
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
                                <h3 className="font-semibold line-clamp-1">Anime NFT #{1000 + i}</h3>
                                <p className="text-sm text-muted-foreground">Anime Collection</p>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-lg font-bold">{(0.5 + Math.random() * 3).toFixed(1)} SOL</div>
                                <div className="text-xs text-muted-foreground">Last: {(0.3 + Math.random() * 2).toFixed(1)} SOL</div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {Math.floor(Math.random() * 30 + 5)}%
                              </Badge>
                            </div>
                            <Button className="w-full mt-3" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="featured" className="mt-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredNFTs.map((nft) => (
                      <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                            {nft.image}
                          </div>
                          <div className="p-4">
                            <Badge className="mb-2">Featured</Badge>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{nft.name}</h3>
                                <p className="text-sm text-muted-foreground">{nft.collection}</p>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-lg font-bold">{nft.price}</div>
                                <div className="text-xs text-muted-foreground">Last: {nft.lastSale}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            </div>
                            <Button className="w-full mt-3">
                              Buy Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="new" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🆕</div>
                    <h3 className="text-xl font-semibold mb-2">New NFTs Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Fresh drops and new collections will appear here
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="trending" className="mt-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📈</div>
                    <h3 className="text-xl font-semibold mb-2">Trending Analysis</h3>
                    <p className="text-muted-foreground">
                      Trending NFTs and collections will be analyzed here
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="mb-8">
                <div className="text-6xl mb-4">🛍️</div>
                <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect your Solana wallet to browse, buy and sell NFTs in our marketplace.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}