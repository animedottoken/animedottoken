
import { Helmet } from "react-helmet-async";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, Eye, Heart, Loader2, Crown, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import { useBoostedListings } from "@/hooks/useBoostedListings";
import { BoostedNFTCard } from "@/components/BoostedNFTCard";
import { BoostModal } from "@/components/BoostModal";

export default function Marketplace() {
  const { connected } = useSolanaWallet();
  const navigate = useNavigate();
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { boostedListings, loading: boostedLoading } = useBoostedListings();
  
  const [nfts, setNfts] = useState<any[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [selectedNFTForBoost, setSelectedNFTForBoost] = useState<any>(null);
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
        
        // Get all NFTs with collection info from secure public view
        const { data: nftsData } = await supabase
          .from('nfts')
          .select(`
            *,
            collections!inner (
              name,
              symbol
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        // Calculate volume from marketplace activities
        const { data: activitiesData } = await supabase
          .from('marketplace_activities')
          .select('price')
          .eq('activity_type', 'sale');

        const totalVolume = activitiesData?.reduce((sum, activity) => sum + (Number(activity.price) || 0), 0) || 0;

        setNfTs(nftsData || []);

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
            totalVolume
          });
        }
        
      } catch (error) {
        console.error('Error loading marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketplaceData();
  }, []);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collections?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price filter
    if (priceRange !== "all" || minPrice || maxPrice) {
      filtered = filtered.filter(nft => {
        if (!nft.is_listed || !nft.price) return false;
        const price = Number(nft.price);
        
        // Custom min/max price filter
        if (minPrice && price < Number(minPrice)) return false;
        if (maxPrice && price > Number(maxPrice)) return false;
        
        // Preset price ranges
        if (priceRange !== "all") {
          switch (priceRange) {
            case "low": return price >= 0.1 && price <= 1;
            case "mid": return price > 1 && price <= 5;
            case "high": return price > 5;
            default: return true;
          }
        }
        
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price-low":
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceA - priceB;
        case "price-high":
          return Number(b.price || 0) - Number(a.price || 0);
        case "popular":
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  }, [nfts, searchTerm, priceRange, minPrice, maxPrice, sortBy]);

  // Helper function to apply filters to any NFT list
  const applyFiltersToList = (nftList: any[]) => {
    let filtered = [...nftList];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collections?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply price filter
    if (priceRange !== "all" || minPrice || maxPrice) {
      filtered = filtered.filter(nft => {
        if (!nft.is_listed || !nft.price) return false;
        const price = Number(nft.price);
        
        // Custom min/max price filter
        if (minPrice && price < Number(minPrice)) return false;
        if (maxPrice && price > Number(maxPrice)) return false;
        
        // Preset price ranges
        if (priceRange !== "all") {
          switch (priceRange) {
            case "low": return price >= 0.1 && price <= 1;
            case "mid": return price > 1 && price <= 5;
            case "high": return price > 5;
            default: return true;
          }
        }
        
        return true;
      });
    }

    return filtered;
  };

  // Get boosted NFTs with their boost data
  const getBoostedNFTs = () => {
    const boostedNFTIds = new Set(boostedListings.map(boost => boost.nft_id));
    const boostedNFTs = nfts
      .filter(nft => boostedNFTIds.has(nft.id))
      .map(nft => {
        const boost = boostedListings.find(b => b.nft_id === nft.id);
        return { nft, boost };
      })
      .filter(item => item.boost) // Ensure boost exists
      .sort((a, b) => a.boost!.bid_rank - b.boost!.bid_rank);

    return applyFiltersToList(boostedNFTs.map(item => item.nft))
      .map(nft => {
        const boost = boostedListings.find(b => b.nft_id === nft.id);
        return { nft, boost };
      })
      .filter(item => item.boost);
  };

  // Get non-boosted NFTs
  const getNonBoostedNFTs = () => {
    const boostedNFTIds = new Set(boostedListings.map(boost => boost.nft_id));
    return applyFiltersToList(nfts.filter(nft => !boostedNFTIds.has(nft.id)));
  };

  // Filter and sort logic
  useEffect(() => {
    const nonBoostedNFTs = getNonBoostedNFTs();

    // Apply sorting to non-boosted NFTs
    nonBoostedNFTs.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price-low":
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return priceA - priceB;
        case "price-high":
          return Number(b.price || 0) - Number(a.price || 0);
        case "popular":
          return (b.views || 0) - (a.views || 0);
        default:
          return 0;
      }
    });

    setFilteredNfts(nonBoostedNFTs);
  }, [nfts, searchTerm, priceRange, minPrice, maxPrice, sortBy, boostedListings]);

  // Get different views of NFTs with filters applied
  const featuredNFTs = applyFiltersToList(nfts.filter(nft => nft.is_featured));
  const newestNFTs = applyFiltersToList(nfts);
  const trendingNFTs = applyFiltersToList(nfts.filter(nft => (nft.views || 0) > 0).sort((a, b) => (b.views || 0) - (a.views || 0)));

  // Handler functions
  const handleLike = (nft: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(nft.id)) {
      removeFromFavorites(nft.id);
    } else {
      addToFavorites({
        id: nft.id,
        name: nft.name,
        image_url: nft.image_url,
        collection_name: nft.collections?.name,
        type: 'nft'
      });
    }
  };

  const handleViewDetails = (nft: any) => {
    // Create navigation params for left/right browsing
    const allNFTIds = [...getBoostedNFTs().map(item => ({ id: item.nft.id, type: 'nft' })), ...filteredNfts.map(n => ({ id: n.id, type: 'nft' }))];
    const encodedNav = encodeURIComponent(JSON.stringify(allNFTIds));
    navigate(`/nft/${nft.id}?from=marketplace&nav=${encodedNav}`);
  };

  const handleBoostNFT = (nft: any) => {
    setSelectedNFTForBoost(nft);
    setBoostModalOpen(true);
  };

  const boostedNFTs = getBoostedNFTs();

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
                Discover, buy and sell exclusive anime NFTs • Boost with $ANIME tokens for premium visibility
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
                <div className="text-2xl font-bold text-primary">{boostedListings.length}</div>
                <div className="text-sm text-muted-foreground">Boosted Items</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search NFTs, collections, or creators..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Price Range Dropdown */}
            <Select value={priceRange} onValueChange={(value) => {
              setPriceRange(value);
              if (value !== "custom") {
                setMinPrice("");
                setMaxPrice("");
              }
            }}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">0.1 - 1 SOL</SelectItem>
                <SelectItem value="mid">1 - 5 SOL</SelectItem>
                <SelectItem value="high">5+ SOL</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Price Inputs */}
            {priceRange === "custom" && (
              <>
                <Input
                  type="number"
                  placeholder="Min SOL"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full md:w-32"
                />
                <Input
                  type="number"
                  placeholder="Max SOL"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full md:w-32"
                />
              </>
            )}
            
            <Select value={sortBy} onValueChange={setSortBy}>
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

          {/* Boosted Items Section */}
          {boostedNFTs.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold">Boosted Items</h2>
                <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  Premium Visibility
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {boostedNFTs.map(({ nft, boost }) => (
                  <BoostedNFTCard
                    key={`boosted-${nft.id}`}
                    nft={nft}
                    boost={boost!}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          )}

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
              ) : filteredNfts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria to find more NFTs.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredNfts.map((nft) => (
                    <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewDetails(nft)}>
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleLike(nft, e)}
                              className={isFavorite(nft.id) ? "text-red-500" : ""}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
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
                          <Button className="w-full mt-3" variant="outline" onClick={(e) => {e.stopPropagation(); handleViewDetails(nft)}}>
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
                    <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewDetails(nft)}>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleLike(nft, e)}
                              className={isFavorite(nft.id) ? "text-red-500" : ""}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
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
                          <Button className="w-full mt-3" onClick={(e) => {e.stopPropagation(); handleViewDetails(nft)}}>
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
                    <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewDetails(nft)}>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleLike(nft, e)}
                              className={isFavorite(nft.id) ? "text-red-500" : ""}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
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
                          <Button className="w-full mt-3" variant="outline" onClick={(e) => {e.stopPropagation(); handleViewDetails(nft)}}>
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading trending NFTs...</span>
                </div>
              ) : trendingNFTs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold mb-2">No Trending NFTs Yet</h3>
                  <p className="text-muted-foreground">
                    NFTs with high activity and views will appear here as the marketplace grows.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {trendingNFTs.map((nft) => (
                    <Card key={nft.id} className="group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewDetails(nft)}>
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
                          <Badge className="mb-2" variant="default">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold line-clamp-1">{nft.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {nft.collections?.name || 'Unknown Collection'}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleLike(nft, e)}
                              className={isFavorite(nft.id) ? "text-red-500" : ""}
                            >
                              <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-lg font-bold">
                                {nft.is_listed && nft.price ? `${Number(nft.price).toFixed(2)} SOL` : 'Not Listed'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {nft.views || 0} views
                              </div>
                            </div>
                            {nft.attributes?.rarity && (
                              <Badge variant="secondary" className="text-xs">
                                {nft.attributes.rarity}
                              </Badge>
                            )}
                          </div>
                          <Button className="w-full mt-3" onClick={(e) => {e.stopPropagation(); handleViewDetails(nft)}}>
                            {nft.is_listed ? 'Buy Now' : 'View Details'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Boost Modal */}
        {selectedNFTForBoost && (
          <BoostModal
            isOpen={boostModalOpen}
            onClose={() => {
              setBoostModalOpen(false);
              setSelectedNFTForBoost(null);
            }}
            nftId={selectedNFTForBoost.id}
            nftName={selectedNFTForBoost.name}
            nftImage={selectedNFTForBoost.image_url}
            onBoostCreated={() => {
              // Refresh boosted listings will happen automatically via the hook
            }}
          />
        )}
      </main>
    </>
  );
}
