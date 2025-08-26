import { useState, useEffect, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatorFollows } from "@/hooks/useCreatorFollows";
import { useNFTLikes } from "@/hooks/useNFTLikes";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";
import { useRealtimeCreatorStats } from "@/hooks/useRealtimeCreatorStats";
import { normalizeAttributes } from '@/lib/attributes';
import { getAttributeValue, hasRequiredListingFields, getNFTCategory, getNFTRoyalty, getNFTExplicitContent } from '@/lib/attributeHelpers';

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
  creator_address_masked: string;
  mint_price?: number;
  max_supply?: number;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { publicKey, connect, connecting } = useSolanaWallet();
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [includeExplicit, setIncludeExplicit] = useState(false);
  const [showPropertyFilter, setShowPropertyFilter] = useState(false);
  const [propertyFilters, setPropertyFilters] = useState<Record<string, string[]>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [royaltyMin, setRoyaltyMin] = useState<string>("");
  const [royaltyMax, setRoyaltyMax] = useState<string>("");
  
  // Initialize activeTab with "collections" as default
  const [activeTab, setActiveTab] = useState<"nfts" | "collections" | "creators">("collections");

  
  const { boostedListings, loading: boostedLoading } = useBoostedListings();
  
  const { followedCreators, isFollowing, toggleFollow, loading: followLoading } = useCreatorFollows();
  
  // Use real-time creator stats for the creators grid
  const creatorWallets = creators.map(c => c.wallet_address);
  const { getCreatorFollowerCount, getCreatorNFTLikeCount } = useRealtimeCreatorStats(creatorWallets);
  
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
  
  // Handle creator follow - now using real-time stats, no local state update needed
  const handleCreatorFollow = async (creatorWallet: string) => {
    if (!publicKey) {
      await connect();
      return;
    }
    try {
      await toggleFollow(creatorWallet);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };
  const { isLiked, toggleLike, loading: likeLoading } = useNFTLikes();

  useEffect(() => {
    loadMarketplaceData();
  }, [activeTab]); // Load data when tab changes

  // Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['nfts', 'collections', 'creators'].includes(tab) && tab !== activeTab) {
      setActiveTab(tab as "nfts" | "collections" | "creators");
    }
  }, [searchParams]);

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', activeTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Load data based on active tab for better performance
      if (activeTab === "nfts") {
        await loadNFTs();
      } else if (activeTab === "collections") {
        await loadCollections();
      } else if (activeTab === "creators") {
        await loadCreators();
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNFTs = async () => {
    const { data: nftData, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('is_listed', true)
      .order('created_at', { ascending: false })
      .limit(100); // Add pagination

    if (nftError) {
      console.error('Error loading NFTs:', nftError);
    } else {
      setNfts(nftData || []);
    }
  };

  const loadCollections = async () => {
    // Use RPC function for public collections
    const { data: collectionData, error: collectionError } = await supabase.rpc('get_collections_public_masked');

    if (collectionError) {
      console.error('Error loading collections:', collectionError);
    } else {
      // Apply ordering and limit client-side since RPC doesn't support these parameters
      const sortedData = (collectionData || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
      setCollections(sortedData);
    }
  };

  const loadCreators = async () => {
    // Optimized: Use single query with join to get creator stats
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
        verified,
        creators_public_stats!wallet_address (
          follower_count,
          nft_likes_count,
          collection_likes_count
        )
      `)
      .not('nickname', 'is', null)
      .order('trade_count', { ascending: false })
      .limit(30); // Reduced limit for faster loading

    if (creatorError) {
      console.error('Error loading creators:', creatorError);
    } else {
      // Get creator counts in batch for better performance
      const walletAddresses = (creatorData || []).map(c => c.wallet_address);
      
      const [nftCounts, collectionCounts] = await Promise.all([
        supabase
          .from('nfts')
          .select('creator_address')
          .in('creator_address', walletAddresses),
        supabase
          .from('collections')
          .select('creator_address')
          .in('creator_address', walletAddresses)
      ]);

      // Count creations per creator
      const nftCountMap = nftCounts.data?.reduce((acc, nft) => {
        acc[nft.creator_address] = (acc[nft.creator_address] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const collectionCountMap = collectionCounts.data?.reduce((acc, collection) => {
        acc[collection.creator_address] = (acc[collection.creator_address] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const creatorsWithStats = (creatorData || []).map(creator => ({
        ...creator,
        created_nfts: nftCountMap[creator.wallet_address] || 0,
        created_collections: collectionCountMap[creator.wallet_address] || 0,
        follower_count: (creator as any).creators_public_stats?.[0]?.follower_count || 0,
        nft_likes_count: (creator as any).creators_public_stats?.[0]?.nft_likes_count || 0,
      }));
      
      setCreators(creatorsWithStats);
    }
  };

  // Memoized filtered data for better performance
  const filteredNfts = useMemo(() => {
    return nfts.filter(nft => {
      // Only show listed NFTs in marketplace
      if (!nft.is_listed) return false;
      
      const matchesSearch = nft.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isNftLiked = isLiked(nft.id);
      const isFromFollowedCreator = followedCreators.includes(nft.creator_address);

      // Use robust attribute helpers to extract values regardless of format
      const category = getNFTCategory(nft.attributes);
      const royalty = getNFTRoyalty(nft.attributes);
      const explicit = getNFTExplicitContent(nft.attributes);

      // Base filter selections
      let matchesFilter = true;
      if (filterBy === "liked") matchesFilter = isNftLiked;
      else if (filterBy === "followed_creators") matchesFilter = isFromFollowedCreator;

      // Enforce mandatory listing rules using the robust helper
      const mandatoryValid = hasRequiredListingFields(nft);

      // Property filters (existing sidebar)
      let matchesPropertyFilters = true;
      if (Object.keys(propertyFilters).length > 0) {
        matchesPropertyFilters = Object.entries(propertyFilters).every(([traitType, selectedValues]) => {
          if (selectedValues.length === 0) return true;
          if (!nft.attributes) return false;
          const nftProperties = normalizeAttributes(nft.attributes);
          const matchingProperty = nftProperties.find(prop => 
            prop.trait_type === traitType && selectedValues.includes(prop.value)
          );
          return !!matchingProperty;
        });
      }

      // New filters: explicit toggle, category, price range, royalties range
      let matchesExplicit = true;
      if (!includeExplicit) matchesExplicit = !explicit;

      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

      const p = nft.price ?? 0;
      let matchesPrice = true;
      if (priceMin) matchesPrice = matchesPrice && p >= parseFloat(priceMin);
      if (priceMax) matchesPrice = matchesPrice && p <= parseFloat(priceMax);

      let matchesRoyalty = true;
      if (royaltyMin) matchesRoyalty = matchesRoyalty && (royalty ?? -1) >= parseFloat(royaltyMin);
      if (royaltyMax) matchesRoyalty = matchesRoyalty && (royalty ?? 999) <= parseFloat(royaltyMax);

      return matchesSearch && matchesFilter && matchesPropertyFilters && matchesExplicit && matchesCategory && matchesPrice && matchesRoyalty && mandatoryValid;
    });
  }, [nfts, searchTerm, isLiked, followedCreators, filterBy, propertyFilters, includeExplicit, categoryFilter, priceMin, priceMax, royaltyMin, royaltyMax]);

  const sortedNfts = useMemo(() => {
    return [...filteredNfts].sort((a, b) => {
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
  }, [filteredNfts, sortBy]);

  const filteredCollections = useMemo(() => {
    return collections.filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collections, searchTerm]);

  const filteredCreators = useMemo(() => {
    return creators.filter(creator => {
      const matchesSearch = creator.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       creator.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
       creator.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (creatorFilter === "followed") {
        matchesFilter = followedCreators.includes(creator.wallet_address);
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [creators, searchTerm, creatorFilter, followedCreators]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(activeTab === "creators" ? 8 : 12)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className={`${activeTab === "creators" ? "aspect-square" : "aspect-square"} bg-muted rounded-t-lg`}></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                {activeTab === "creators" && (
                  <>
                    <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-12 bg-muted rounded"></div>
                      ))}
                    </div>
                  </>
                )}
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
          variant={activeTab === "collections" ? "default" : "outline"}
          onClick={() => setActiveTab("collections")}
        >
          Collections
        </Button>
        <Button
          variant={activeTab === "nfts" ? "default" : "outline"}
          onClick={() => setActiveTab("nfts")}
        >
          NFTs
        </Button>
        <Button 
          variant={activeTab === "creators" ? "default" : "outline"}
          onClick={() => setActiveTab("creators")}
        >
          Creators
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 min-h-[40px] will-change-contents">
        <div className="relative flex-shrink-0 min-w-[220px] w-[220px]">
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
              <SelectTrigger className="w-[130px] flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NFTs</SelectItem>
                <SelectItem value="liked">❤️ Liked</SelectItem>
                <SelectItem value="followed_creators">👥 From Liked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] flex-shrink-0">
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

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Switch
                id="explicit-content"
                checked={includeExplicit}
                onCheckedChange={setIncludeExplicit}
              />
              <Label htmlFor="explicit-content" className="text-sm whitespace-nowrap">
                Incl. sensitive/explicit
              </Label>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] flex-shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Photography">Photography</SelectItem>
                <SelectItem value="Collectibles">Collectibles</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Input type="number" inputMode="decimal" placeholder="Min $" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-24" />
              <span className="text-sm text-muted-foreground">-</span>
              <Input type="number" inputMode="decimal" placeholder="Max $" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-24" />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Input type="number" inputMode="decimal" placeholder="Min Roy%" value={royaltyMin} onChange={(e) => setRoyaltyMin(e.target.value)} className="w-20" />
              <span className="text-sm text-muted-foreground">-</span>
              <Input type="number" inputMode="decimal" placeholder="Max Roy%" value={royaltyMax} onChange={(e) => setRoyaltyMax(e.target.value)} className="w-20" />
            </div>

            <div className="flex gap-1 flex-shrink-0">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {collection.items_redeemed}/{collection.max_supply || '∞'} minted
                  </span>
                  {collection.mint_price && collection.mint_price > 0 && (
                    <span className="font-medium">
                      <span className="text-primary">Price</span> {collection.mint_price} SOL
                    </span>
                  )}
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
                        handleCreatorFollow(creator.wallet_address);
                      }}
                      className="inline-flex items-center justify-center p-1 rounded-md hover:bg-muted transition-colors"
                      aria-label={!publicKey ? 'Connect to like creator' : (isFollowing(creator.wallet_address) ? 'Unlike creator' : 'Like creator')}
                      disabled={followLoading || connecting}
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
                 <div className="grid grid-cols-4 gap-2 mb-4">
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
                             <span>{getCreatorFollowerCount(creator.wallet_address)}</span>
                           </div>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Profile Likes</p>
                       </TooltipContent>
                     </Tooltip>
                     
                     {/* NFT Likes */}
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <div className="text-center p-2 rounded-lg bg-muted/50 cursor-help h-16 flex items-center justify-center">
                           <div className="text-sm font-medium flex flex-col items-center justify-center gap-1 text-primary">
                             <Heart className="w-3 h-3 fill-current" />
                             <span>{getCreatorNFTLikeCount(creator.wallet_address)}</span>
                           </div>
                         </div>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>NFT Likes</p>
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
