import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, Eye, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { QuickNav } from "@/components/QuickNav";

export default function Marketplace() {
  const { connected } = useSolanaWallet();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalOwners: 0,
    floorPrice: 0,
    totalVolume: 0
  });

  // Load real NFTs and stats from database
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        setLoading(true);
        
        // Get all NFTs
        const { data: nftsData } = await supabase
          .from('nfts')
          .select(`
            *,
            collections (
              name,
              symbol
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        setNfts(nftsData || []);

        // Calculate stats
        if (nftsData) {
          const uniqueOwners = new Set(nftsData.map(nft => nft.owner_address)).size;
          const listedNFTs = nftsData.filter(nft => nft.is_listed && nft.price);
          const floorPrice = listedNFTs.length > 0 
            ? Math.min(...listedNFTs.map(nft => Number(nft.price)))
            : 0;

          setStats({
            totalItems: nftsData.length,
            totalOwners: uniqueOwners,
            floorPrice,
            totalVolume: 0 // Would calculate from marketplace_activities in real implementation
          });
        }
        
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      loadMarketplaceData();
    }
  }, [connected]);

  // Get featured NFTs (most recent 6)
  const featuredNFTs = nfts.slice(0, 6);
  
  // Get newest NFTs (most recent 12) 
  const newestNFTs = nfts.slice(0, 12);

  return (
    <>
      <Helmet>
        <title>NFT Marketplace | Anime Token - Buy, Sell & Trade Anime NFTs</title>
        <meta name="description" content="Discover, buy and sell exclusive anime NFTs on our Solana-powered marketplace. Low fees, instant transactions, vibrant community." />
        <meta name="keywords" content="NFT marketplace, anime NFT, Solana marketplace, buy NFT, sell NFT, digital collectibles" />
      </Helmet>
      
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Quick Navigation */}
          <QuickNav className="mb-6 hidden md:flex" />
          
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
            <div className="pr-16">
              <SolanaWalletButton />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.totalOwners}</div>
                <div className="text-sm text-muted-foreground">Owners</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">
                  {stats.floorPrice > 0 ? stats.floorPrice.toFixed(2) : 'FREE'}
                </div>
                <div className="text-sm text-muted-foreground">Floor (SOL)</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.totalVolume}</div>
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
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading NFTs...</span>
                    </div>
                  ) : nfts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎨</div>
                      <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to mint an NFT! Visit our mint page to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {nfts.map((nft) => (
                        <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                              <img 
                                src={nft.image_url} 
                                alt={nft.name}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/og-anime.jpg';
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {nft.collections?.name || 'Unknown Collection'}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-lg font-bold">
                                    {nft.is_listed && nft.price ? `${Number(nft.price).toFixed(2)} SOL` : 'Not Listed'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Owner: {nft.owner_address.slice(0, 4)}...{nft.owner_address.slice(-4)}
                                  </div>
                                </div>
                                {nft.attributes?.rarity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {nft.attributes.rarity}
                                  </Badge>
                                )}
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
                  )}
                </TabsContent>

                <TabsContent value="featured" className="mt-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading featured NFTs...</span>
                    </div>
                  ) : featuredNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">⭐</div>
                      <h3 className="text-xl font-semibold mb-2">No Featured NFTs Yet</h3>
                      <p className="text-muted-foreground">
                        Featured NFTs will appear here as they are selected by the community.
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {featuredNFTs.map((nft) => (
                        <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                              <img 
                                src={nft.image_url} 
                                alt={nft.name}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/og-anime.jpg';
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <Badge className="mb-2">Featured</Badge>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold">{nft.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {nft.collections?.name || 'Unknown Collection'}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-lg font-bold">
                                    {nft.is_listed && nft.price ? `${Number(nft.price).toFixed(2)} SOL` : 'Not Listed'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Minted: {new Date(nft.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                {nft.attributes?.rarity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {nft.attributes.rarity}
                                  </Badge>
                                )}
                              </div>
                              <Button className="w-full mt-3">
                                {nft.is_listed ? 'Buy Now' : 'View Details'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="new" className="mt-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading newest NFTs...</span>
                    </div>
                  ) : newestNFTs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🆕</div>
                      <h3 className="text-xl font-semibold mb-2">No New NFTs Yet</h3>
                      <p className="text-muted-foreground">
                        Fresh drops and new collections will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {newestNFTs.map((nft) => (
                        <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                              <img 
                                src={nft.image_url} 
                                alt={nft.name}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/og-anime.jpg';
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <Badge className="mb-2" variant="outline">New</Badge>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {nft.collections?.name || 'Unknown Collection'}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-lg font-bold">
                                    {nft.is_listed && nft.price ? `${Number(nft.price).toFixed(2)} SOL` : 'Not Listed'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Minted: {new Date(nft.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                {nft.attributes?.rarity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {nft.attributes.rarity}
                                  </Badge>
                                )}
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
                  )}
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