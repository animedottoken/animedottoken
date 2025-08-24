import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Grid, List, SortAsc, SortDesc, Filter, Crown, Rocket, Zap, Heart, Info, UserPlus, UserMinus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useBoostedListings } from "@/hooks/useBoostedListings";
import { BoostedNFTCard } from "@/components/BoostedNFTCard";
// removed favorites import
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useNFTLikes } from "@/hooks/useNFTLikes";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";

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
  follower_count: number;
  nft_likes_count: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { publicKey } = useSolanaWallet();
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Initialize activeTab from URL parameter or default to "nfts"
  const [activeTab, setActiveTab] = useState<"nfts" | "collections" | "creators">(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'creators' || tabParam === 'collections' || tabParam === 'nfts') {
      return tabParam;
    }
    return "nfts";
  });

  // Update URL when tab changes
  const handleTabChange = (tab: "nfts" | "collections" | "creators") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };
  
  const { boostedListings, loading: boostedLoading } = useBoostedListings();
  const { addToFavorites, removeFromFavorites, isFavorite, favorites } = useFavorites();
  const { followedCreators, isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();

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

      // Load Creators with stats
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
        // Get creator stats and NFT count for each creator
        const creatorsWithStats = await Promise.all(
          (creatorData || []).map(async (creator) => {
            // Get NFT count
            const { count } = await supabase
              .from('nfts')
              .select('*', { count: 'exact', head: true })
              .eq('creator_address', creator.wallet_address);
            
            // Get creator stats (followers and NFT likes)
            const { data: statsData } = await supabase
              .from('creators_public_stats')
              .select('follower_count, nft_likes_count')
              .eq('wallet_address', creator.wallet_address)
              .single();
            
            return {
              ...creator,
              created_nfts: count || 0,
              follower_count: statsData?.follower_count || 0,
              nft_likes_count: statsData?.nft_likes_count || 0,
            };
          })
        );
        setCreators(creatorsWithStats);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNfts = nfts.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isNftLiked = isLiked(nft.id);
    const isFromFollowedCreator = followedCreators.includes(nft.creator_address);
    
    let matchesFilter = true;
    if (filterBy === "listed") matchesFilter = nft.is_listed;
    else if (filterBy === "unlisted") matchesFilter = !nft.is_listed;
    else if (filterBy === "liked") matchesFilter = isNftLiked;
    else if (filterBy === "followed_creators") matchesFilter = isFromFollowedCreator;
    
    return matchesSearch && matchesFilter;
  });

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

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     creator.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
     creator.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (creatorFilter === "followed") {
      matchesFilter = followedCreators.includes(creator.wallet_address);
    }
    
    return matchesSearch && matchesFilter;
  });

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
          onClick={() => handleTabChange("nfts")}
        >
          NFTs
        </Button>
        <Button
          variant={activeTab === "collections" ? "default" : "outline"}
          onClick={() => handleTabChange("collections")}
        >
          Collections
        </Button>
        <Button 
          variant={activeTab === "creators" ? "default" : "outline"}
          onClick={() => handleTabChange("creators")}
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
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="liked">❤️ Liked</SelectItem>
                <SelectItem value="followed_creators">👥 From Liked</SelectItem>
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

        {activeTab === "creators" && (
          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-[120px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="followed">Liked</SelectItem>
            </SelectContent>
          </Select>
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
                  <img
                    src={nft.image_url || "/placeholder.svg"}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate">{nft.name}</h3>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={likeLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(nft.id);
                        }}
                        className={isLiked(nft.id) ? "text-destructive" : "text-muted-foreground"}
                      >
                        <Heart className={`h-4 w-4 ${isLiked(nft.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
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
                 <img
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
          style={{ cursor: 'pointer' }}
            >
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage 
                    src={creator.profile_image_url} 
                    alt={creator.nickname || creator.wallet_address} 
                  />
                  <AvatarFallback className="text-xl">
                    {creator.nickname?.slice(0, 2).toUpperCase() || creator.wallet_address.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {creator.nickname || `${creator.wallet_address.slice(0, 4)}...${creator.wallet_address.slice(-4)}`}
                    </h3>
                    {creator.verified && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </div>
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                      {creator.bio}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{creator.follower_count} likes</span>
                    <span>•</span>
                    <span>{creator.nft_likes_count} NFT likes</span>
                    <span>•</span>
                    <span>{creator.created_nfts} NFTs</span>
                    <span>•</span>
                    <span>{creator.trade_count} trades</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className={`${
                        creator.profile_rank === 'DIAMOND' ? 'border-purple-500 text-purple-600' :
                        creator.profile_rank === 'GOLD' ? 'border-yellow-500 text-yellow-600' :
                        creator.profile_rank === 'SILVER' ? 'border-gray-400 text-gray-600' :
                        creator.profile_rank === 'BRONZE' ? 'border-orange-500 text-orange-600' :
                        'border-green-500 text-green-600'
                      }`}
                    >
                      <span>{creator.profile_rank === 'DEFAULT' ? 'Rookie' : creator.profile_rank}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="inline-flex items-center ml-1" aria-label="Rank info">
                              <Info className="w-3 h-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2 text-sm">
                              <div className="font-semibold">Ranking System:</div>
                              <div>🏆 <strong>Diamond</strong>: 1,000+ trades</div>
                              <div>🥇 <strong>Gold</strong>: 250+ trades</div>
                              <div>🥈 <strong>Silver</strong>: 50+ trades</div>
                              <div>🥉 <strong>Bronze</strong>: 10+ trades</div>
                              <div>🎖️ <strong>Rookie</strong>: 0-9 trades</div>
                              <div className="text-xs text-muted-foreground mt-2">
                                Trade more NFTs to increase your rank!
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Badge>
                  </div>
                  {publicKey && (
                    <button
                      aria-label={isFollowing(creator.wallet_address) ? 'Unlike creator' : 'Like creator'}
                      disabled={followLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollow(creator.wallet_address);
                      }}
                      className="inline-flex items-center justify-center p-2 rounded-md border hover:bg-muted transition-colors"
                    >
                      <Heart className={`${isFollowing(creator.wallet_address) ? 'fill-current text-destructive' : 'text-muted-foreground'} w-5 h-5`} />
                    </button>
                  )}
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
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
