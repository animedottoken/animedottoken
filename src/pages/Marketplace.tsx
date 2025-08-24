import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Grid, List, SortAsc, SortDesc, Filter, Crown, Rocket, Zap, Heart, Info, UserPlus, UserMinus, Users, ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useBoostedListings } from "@/hooks/useBoostedListings";
import { BoostedNFTCard } from "@/components/BoostedNFTCard";
import { NFTCard } from "@/components/NFTCard";
import { PropertyFilter } from "@/components/PropertyFilter";
// removed favorites import
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useNFTLikes } from "@/hooks/useNFTLikes";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";
import { normalizeAttributes } from '@/lib/attributes';

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
  created_collections: number;
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
  const [showPropertyFilter, setShowPropertyFilter] = useState(false);
  const [propertyFilters, setPropertyFilters] = useState<Record<string, string[]>>({});
  
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
  
  const { followedCreators, isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  
  // Helper functions for rank display
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'BRONZE': return 'border-amber-600';
      case 'SILVER': return 'border-slate-400';
      case 'GOLD': return 'border-yellow-500';
      case 'DIAMOND': return 'border-cyan-400';
      default: return 'border-border';
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'BRONZE': return { text: 'Bronze', color: 'bg-amber-600', icon: '🥉' };
      case 'SILVER': return { text: 'Silver', color: 'bg-slate-400', icon: '🥈' };
      case 'GOLD': return { text: 'Gold', color: 'bg-yellow-500', icon: '🥇' };
      case 'DIAMOND': return { text: 'Diamond', color: 'bg-cyan-400', icon: '🏆' };
      default: return { text: 'Starter', color: 'bg-muted', icon: '🌟' };
    }
  };
  
  // Update creator follower count locally when follow status changes
  const handleCreatorFollow = async (creatorWallet: string) => {
    const isCurrentlyFollowing = isFollowing(creatorWallet);
    
    try {
      await toggleFollow(creatorWallet);
      
      // Update the local creator stats immediately
      setCreators(prevCreators => 
        prevCreators.map(creator => 
          creator.wallet_address === creatorWallet 
            ? { 
                ...creator, 
                follower_count: isCurrentlyFollowing 
                  ? Math.max(0, creator.follower_count - 1)
                  : creator.follower_count + 1
              }
            : creator
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();

  useEffect(() => {
    loadMarketplaceData();
    // Note: Real-time updates for follows and likes are handled by their respective hooks
    // (useCreatorFollows, useNFTLikes) so we don't need to reload all marketplace data here
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
            const { count: nftCount } = await supabase
              .from('nfts')
              .select('*', { count: 'exact', head: true })
              .eq('creator_address', creator.wallet_address);
            
            // Get collection count
            const { count: collectionCount } = await supabase
              .from('collections')
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
              created_nfts: nftCount || 0,
              created_collections: collectionCount || 0,
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
    
    // Apply property filters
    let matchesPropertyFilters = true;
    if (Object.keys(propertyFilters).length > 0) {
      matchesPropertyFilters = Object.entries(propertyFilters).every(([traitType, selectedValues]) => {
        if (selectedValues.length === 0) return true;
        
        if (!nft.attributes) return false;
        
        // Use shared normalization function
        const nftProperties = normalizeAttributes(nft.attributes);
        
        const matchingProperty = nftProperties.find(prop => 
          prop.trait_type === traitType && selectedValues.includes(prop.value)
        );
        
        return !!matchingProperty;
      });
    }
    
    return matchesSearch && matchesFilter && matchesPropertyFilters;
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
              <Button
                variant={showPropertyFilter ? "default" : "outline"}
                size="icon"
                onClick={() => setShowPropertyFilter(!showPropertyFilter)}
                title="Toggle property filters"
              >
                <Filter className="h-4 w-4" />
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

      {/* Content */}
      {activeTab === "nfts" ? (
        <div className="flex gap-6">
          {/* Property Filter Sidebar */}
          {showPropertyFilter && (
            <div className="flex-shrink-0">
              <PropertyFilter
                nfts={filteredNfts}
                selectedFilters={propertyFilters}
                onFiltersChange={setPropertyFilters}
              />
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Boosted NFTs Section */}
            {boostedListings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Boosted Items
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {boostedListings.slice(0, 8).map((listing) => {
                    // Create combined navigation array: boosted NFTs first, then regular NFTs
                    const allNFTIds = [
                      ...boostedListings.slice(0, 8).map(boost => boost.nft_id),
                      ...sortedNfts.map(nft => nft.id)
                    ];
                    const queryString = `from=marketplace&tab=${activeTab}&nav=${encodeURIComponent(JSON.stringify(allNFTIds))}`;
                
                    return (
                      <BoostedNFTCard 
                        key={listing.id} 
                        listing={listing} 
                        navigationQuery={queryString}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Info */}
            {(Object.keys(propertyFilters).length > 0 || searchTerm || filterBy !== "all") && (
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {sortedNfts.length} NFTs
                  {Object.keys(propertyFilters).length > 0 && (
                    <span> with {Object.values(propertyFilters).reduce((acc, vals) => acc + vals.length, 0)} property filters</span>
                  )}
                </div>
              </div>
            )}

            {/* Regular NFTs */}
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {sortedNfts.map((nft) => {
                // Create combined navigation array: boosted NFTs first, then regular NFTs
                const allNFTIds = [
                  ...boostedListings.slice(0, 8).map(boost => boost.nft_id),
                  ...sortedNfts.map(n => n.id)
                ];
                const queryString = `from=marketplace&tab=${activeTab}&nav=${encodeURIComponent(JSON.stringify(allNFTIds))}`;
                
                return (
                  <NFTCard 
                    key={nft.id}
                    nft={nft}
                    navigationQuery={queryString}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === "collections" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card 
              key={collection.id}
              className="group hover:shadow-lg transition-all cursor-pointer"
              onClick={() => {
                const navIds = filteredCollections.map(c => c.id);
                const queryString = `from=marketplace&tab=${activeTab}&nav=${encodeURIComponent(JSON.stringify(navIds))}`;
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
              onClick={() => {
                const navCreators = filteredCreators.map(c => c.wallet_address);
                const queryString = `from=marketplace&tab=${activeTab}&nav=${encodeURIComponent(JSON.stringify(navCreators))}`;
                navigate(`/profile/${creator.wallet_address}?${queryString}`);
              }}
            >
               <CardContent className="p-6 text-center">
                {/* Avatar with rank border */}
                <div className="relative mb-4">
                  <Avatar className={`w-24 h-24 mx-auto border-2 ${getRankColor(creator.profile_rank)}`}>
                    <AvatarImage 
                      src={creator.profile_image_url} 
                      alt={creator.nickname || creator.wallet_address} 
                    />
                    <AvatarFallback className="text-xl">
                      {creator.nickname?.slice(0, 2).toUpperCase() || creator.wallet_address.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Rank badge */}
                  {creator.profile_rank !== 'DEFAULT' && (
                    <Badge className={`absolute -bottom-1 -right-1 ${getRankBadge(creator.profile_rank).color} text-white text-xs px-1`}>
                      <Crown className="w-2 h-2 mr-0.5" />
                      {getRankBadge(creator.profile_rank).text[0]}
                    </Badge>
                  )}
                </div>

                {/* Profile Info Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {creator.nickname || 'Anonymous'}
                    </h3>
                    {creator.verified && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                    {/* Follow button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!publicKey) {
                          toast.error('Please connect your wallet to like creators');
                          return;
                        }
                        handleCreatorFollow(creator.wallet_address);
                      }}
                      className="inline-flex items-center justify-center p-1 rounded-md hover:bg-muted transition-colors"
                      aria-label={publicKey ? (isFollowing(creator.wallet_address) ? 'Unlike creator' : 'Like creator') : 'Connect wallet to like'}
                      disabled={followLoading}
                    >
                      <Heart className={`${publicKey && isFollowing(creator.wallet_address) ? 'fill-current text-destructive' : 'text-muted-foreground'} w-4 h-4`} />
                    </button>
                  </div>
                  
                  {/* Wallet Address */}
                  <p className="text-sm text-muted-foreground">
                    {creator.wallet_address.slice(0, 4)}...{creator.wallet_address.slice(-4)}
                  </p>
                </div>
                
                {/* Bio */}
                {creator.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {creator.bio}
                  </p>
                )}

                {/* Stats with icons and tooltips */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <TooltipProvider>
                    {/* Rank */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-2 rounded-lg bg-muted/50 cursor-help h-16 flex items-center justify-center">
                          <div className="text-sm font-medium flex flex-col items-center justify-center gap-1">
                            <span>{getRankBadge(creator.profile_rank).icon}</span>
                            <span>{getRankBadge(creator.profile_rank).text}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rank</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* NFTs */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-2 rounded-lg bg-muted/50 cursor-help h-16 flex items-center justify-center">
                          <div className="text-sm font-medium flex flex-col items-center justify-center gap-1 text-primary">
                            <Grid3x3 className="w-3 h-3" />
                            <span>{creator.created_nfts}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>NFTs</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {/* Profile Likes */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center p-2 rounded-lg bg-muted/50 cursor-help h-16 flex items-center justify-center">
                          <div className="text-sm font-medium flex flex-col items-center justify-center gap-1 text-destructive">
                            <Heart className="w-3 h-3" />
                            <span>{creator.follower_count}</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Profile Likes</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
