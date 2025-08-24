import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid, List, SortAsc, SortDesc, Filter, Crown, Rocket, Zap, Heart } from "lucide-react";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import { supabase } from "@/integrations/supabase/client";
import { useBoostedListings } from "@/hooks/useBoostedListings";
import { BoostedNFTCard } from "@/components/BoostedNFTCard";
import { useFavorites } from "@/hooks/useFavorites";

interface NFT {
  id: string;
  name: string;
  image_url: string;
  price?: number;
  owner_address: string;
  creator_address: string;
  mint_address: string;
  is_listed: boolean;
  collection_id?: string;
  description?: string;
  attributes?: any;
}

interface Collection {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  verified: boolean;
  items_redeemed: number;
  creator_address: string;
}

interface Creator {
  id: string;
  wallet_address: string;
  nickname?: string;
  bio?: string;
  profile_image_url?: string;
  trade_count: number;
  profile_rank: string;
  verified: boolean;
  created_nfts: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"nfts" | "collections" | "creators">("nfts");
  
  const { boostedListings, loading: boostedLoading } = useBoostedListings();
  const { addToFavorites, removeFromFavorites, isFavorite, favorites } = useFavorites();

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Load NFTs
      const { data: nftData, error: nftError } = await supabase
        .from('nfts')
        .select('*')
        .order('created_at', { ascending: false });

      if (nftError) {
        console.error('Error loading NFTs:', nftError);
      } else {
        setNfts(nftData || []);
      }

      // Load Collections
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (collectionError) {
        console.error('Error loading collections:', collectionError);
      } else {
        setCollections(collectionData || []);
      }

      // Load Creators
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          wallet_address,
          nickname,
          bio,
          profile_image_url,
          trade_count,
          profile_rank,
          verified
        `)
        .not('nickname', 'is', null)
        .order('trade_count', { ascending: false })
        .limit(50);

      if (creatorError) {
        console.error('Error loading creators:', creatorError);
      } else {
        // Get NFT count for each creator
        const creatorsWithCounts = await Promise.all(
          (creatorData || []).map(async (creator) => {
            const { count } = await supabase
              .from('nfts')
              .select('*', { count: 'exact', head: true })
              .eq('creator_address', creator.wallet_address);
            
            return {
              ...creator,
              created_nfts: count || 0
            };
          })
        );
        setCreators(creatorsWithCounts);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNfts = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isNftFavorite = isFavorite(nft.id);
    const matchesFilter = filterBy === "all" || 
      (filterBy === "listed" && nft.is_listed) ||
      (filterBy === "unlisted" && !nft.is_listed) ||
      (filterBy === "favorites" && isNftFavorite);
    
    // Debug logging for favorites filter
    if (filterBy === "favorites") {
      console.log(`Favorites filter active. Total favorites: ${favorites.length}`);
      console.log(`NFT ${nft.name} (${nft.id}): isFavorite = ${isNftFavorite}`);
      console.log(`Current favorites:`, favorites.map(f => f.id));
    }
    
    return matchesSearch && matchesFilter;
  });

  console.log(`Filter: ${filterBy}, Total NFTs: ${nfts.length}, Filtered: ${filteredNfts.length}, Favorites count: ${favorites.length}`);

  const sortedNfts = [...filteredNfts].sort((a, b) => {
    switch (sortBy) {
      case "price_low":
        return (a.price || 0) - (b.price || 0);
      case "price_high":
        return (b.price || 0) - (a.price || 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "oldest":
        return new Date(a.id).getTime() - new Date(b.id).getTime();
      default: // newest
        return new Date(b.id).getTime() - new Date(a.id).getTime();
    }
  });

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCreators = creators.filter(creator =>
    (creator.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     creator.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
     creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and collect unique digital art from the ANIME community
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === "nfts" ? "default" : "outline"}
          onClick={() => setActiveTab("nfts")}
        >
          NFTs
        </Button>
        <Button
          variant={activeTab === "collections" ? "default" : "outline"}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </Button>
        <Button
          variant={activeTab === "creators" ? "default" : "outline"}
          onClick={() => setActiveTab("creators")}
        >
          Creators
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {activeTab === "nfts" && (
          <>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="favorites">❤️ Favorites</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Boosted NFTs Section */}
      {activeTab === "nfts" && boostedListings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Boosted Items
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boostedListings.slice(0, 8).map((listing) => (
              <BoostedNFTCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "nfts" ? (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {sortedNfts.map((nft) => (
             <Card 
               key={nft.id}
               className="group hover:shadow-lg transition-all cursor-pointer relative"
               onClick={() => {
                 const navIds = sortedNfts.map(n => n.id);
                 const queryString = `from=marketplace&nav=${encodeURIComponent(JSON.stringify(navIds))}`;
                 navigate(`/nft/${nft.id}?${queryString}`);
               }}
             >
               <div className="aspect-square overflow-hidden rounded-t-lg">
                 <ImageLazyLoad
                   src={nft.image_url || "/placeholder.svg"}
                   alt={nft.name}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                 />
               </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate">{nft.name}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite(nft.id)) {
                          removeFromFavorites(nft.id);
                        } else {
                          addToFavorites({
                            id: nft.id,
                            name: nft.name,
                            image_url: nft.image_url,
                            type: 'nft'
                          });
                        }
                      }}
                      className={isFavorite(nft.id) ? "text-red-500" : ""}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite(nft.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {nft.is_listed && nft.price ? (
                      <div className="text-lg font-bold text-primary">
                        {nft.price} SOL
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Not Listed
                      </div>
                    )}
                  </div>
                </CardContent>
             </Card>
           ))}
         </div>
      ) : activeTab === "collections" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card 
              key={collection.id}
              className="group hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const navIds = filteredCollections.map(c => c.id);
                const queryString = `from=marketplace&nav=${encodeURIComponent(JSON.stringify(navIds))}`;
                navigate(`/collection/${collection.id}?${queryString}`);
              }}
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <ImageLazyLoad
                  src={collection.image_url || "/placeholder.svg"}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold truncate">{collection.name}</h3>
                  {collection.verified && (
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{collection.items_redeemed} items</span>
                </div>
              </CardContent>
             </Card>
           ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreators.map((creator) => (
            <Card 
              key={creator.id}
              className="group hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/profile/${creator.wallet_address}`)}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-3">
                    {creator.profile_image_url ? (
                      <ImageLazyLoad
                        src={creator.profile_image_url}
                        alt={creator.nickname || 'Creator'}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                        {creator.nickname?.slice(0, 2).toUpperCase() || creator.wallet_address.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="font-semibold">
                      {creator.nickname || `${creator.wallet_address.slice(0, 4)}...${creator.wallet_address.slice(-4)}`}
                    </h3>
                    {creator.verified && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </div>
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground italic mb-2 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>{creator.trade_count} trades</span>
                    <span>{creator.created_nfts} NFTs</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${
                      creator.profile_rank === 'DIAMOND' ? 'border-purple-500 text-purple-600' :
                      creator.profile_rank === 'GOLD' ? 'border-yellow-500 text-yellow-600' :
                      creator.profile_rank === 'SILVER' ? 'border-gray-400 text-gray-600' :
                      creator.profile_rank === 'BRONZE' ? 'border-orange-500 text-orange-600' :
                      'border-green-500 text-green-600'
                    }`}
                  >
                    {creator.profile_rank === 'DEFAULT' ? 'Rookie' : creator.profile_rank}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeTab === "nfts" && sortedNfts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No NFTs found matching your criteria.</p>
        </div>
      )}

      {activeTab === "collections" && filteredCollections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections found matching your criteria.</p>
        </div>
      )}

      {activeTab === "creators" && filteredCreators.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No creators found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
