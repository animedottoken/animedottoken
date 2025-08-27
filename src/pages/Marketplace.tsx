import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNFTs } from "@/hooks/useNFTs";
import { useCollections } from "@/hooks/useCollections";
import { NFTCard } from "@/components/NFTCard";
import { CollectionCard } from "@/components/CollectionCard";
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { hasRequiredListingFields } from '@/lib/attributeHelpers';
import { setNavContext } from "@/lib/navContext";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [includeExplicit, setIncludeExplicit] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();

  const { nfts, loading: nftsLoading } = useNFTs();
  const { collections, loading: collectionsLoading } = useCollections();
  const { publicKey } = useSolanaWallet();

  useEffect(() => {
    // Optional: Fetch initial data or perform other setup tasks
  }, []);

  // Filter NFTs to only show listed items with required fields
  const filteredNFTs = useMemo(() => {
    if (nftsLoading || !nfts) return [];
    
    return nfts.filter(nft => {
      // Marketplace must only show listed NFTs with all required fields
      if (!nft.is_listed || !hasRequiredListingFields(nft)) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!nft.name.toLowerCase().includes(query) && !nft.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && nft.category !== selectedCategory) {
        return false;
      }

      // Explicit content filter
      if (!includeExplicit && nft.attributes?.explicit_content) {
        return false;
      }

      // Price filters
      if (minPrice && nft.price && nft.price < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && nft.price && nft.price > parseFloat(maxPrice)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });
  }, [nfts, searchQuery, selectedCategory, includeExplicit, sortBy, minPrice, maxPrice, nftsLoading]);

  // Filter Collections to only show live collections with required fields
  const filteredCollections = useMemo(() => {
    if (collectionsLoading || !collections) return [];
    
    return collections.filter(collection => {
      // Marketplace must only show live collections that are active
      if (!collection.is_active || !collection.is_live) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = collection.name.toLowerCase().includes(query);
        const matchesDescription = collection.description?.toLowerCase().includes(query) ||
                                 collection.site_description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Category filter
      if (selectedCategory && collection.category !== selectedCategory) {
        return false;
      }

      // Explicit content filter
      if (!includeExplicit && collection.explicit_content) {
        return false;
      }

      // Price filters (mint price)
      if (minPrice && collection.mint_price && collection.mint_price < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && collection.mint_price && collection.mint_price > parseFloat(maxPrice)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-high':
          return (b.mint_price || 0) - (a.mint_price || 0);
        case 'price-low':
          return (a.mint_price || 0) - (b.mint_price || 0);
        default:
          return 0;
      }
    });
  }, [collections, searchQuery, selectedCategory, includeExplicit, sortBy, minPrice, maxPrice, collectionsLoading]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setIncludeExplicit(false);
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Filter Bar */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search NFTs and collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                <SelectItem value="Art">Art</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Photography">Photography</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Utility">Utility</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Sort By</Label>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price-high">Price High to Low</SelectItem>
                <SelectItem value="price-low">Price Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Switch
              id="explicit"
              checked={includeExplicit}
              onCheckedChange={setIncludeExplicit}
            />
            <Label htmlFor="explicit" className="text-sm">Include Explicit</Label>
          </div>

          <div className="flex items-end">
            {(searchQuery || selectedCategory || includeExplicit || minPrice || maxPrice) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Price Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Min Price (SOL)</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max Price (SOL)</Label>
            <Input
              type="number"
              placeholder="1000.0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nftsLoading ? (
          // Skeleton loaders
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredNFTs.length > 0 ? (
          // NFT Cards
           filteredNFTs.map((nft) => (
             <NFTCard
               key={nft.id}
               nft={nft}
               onNavigate={() => setNavContext({ 
                 type: 'nft', 
                 items: filteredNFTs.map(n => n.id), 
                 source: 'marketplace' 
               })}
             />
           ))
        ) : (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No NFTs match your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Collection Grid */}
      <h2 className="text-2xl font-bold mt-8">Collections</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collectionsLoading ? (
          // Skeleton loaders
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredCollections.length > 0 ? (
          // Collection Cards
           filteredCollections.map((collection) => (
             <CollectionCard
               key={collection.id}
               collection={{
                 ...collection,
                 image_url: collection.image_url || '/placeholder.svg',
                 creator_address_masked: collection.creator_address,
                 items_redeemed: collection.items_redeemed || 0
               }}
               onNavigate={() => setNavContext({ 
                 type: 'collection', 
                 items: filteredCollections.map(c => c.id), 
                 source: 'marketplace' 
               })}
             />
           ))
        ) : (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No collections match your filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
