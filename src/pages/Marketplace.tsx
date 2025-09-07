import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNFTs } from "@/hooks/useNFTs";
import { usePublicCollections } from "@/hooks/usePublicCollections";
import { useCreatorsPublic } from "@/hooks/useCreatorsPublic";
import { NFTCard } from "@/components/NFTCard";
import { CollectionCard } from "@/components/CollectionCard";
import { CreatorCardCompact } from "@/components/CreatorCardCompact";
import { hasRequiredListingFields } from '@/lib/attributeHelpers';
import { setNavContext } from "@/lib/navContext";
import { useCollectionLikeCounts } from '@/hooks/useLikeCounts';
import { useProfileFilters } from '@/contexts/ProfileFiltersContext';

const Marketplace = () => {
  const [activeTab, setActiveTab] = useState<'explore' | 'creators'>('explore');
  
  // Collapsible states with localStorage persistence
  const [collectionsOpen, setCollectionsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('marketplace-collections-open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [nftsOpen, setNftsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('marketplace-nfts-open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Persist collapsible states
  useEffect(() => {
    try {
      localStorage.setItem('marketplace-collections-open', JSON.stringify(collectionsOpen));
    } catch {}
  }, [collectionsOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('marketplace-nfts-open', JSON.stringify(nftsOpen));
    } catch {}
  }, [nftsOpen]);
  
  // Use shared filters from context
  const { filters, setCurrentPriceRange, setCurrentRoyaltyRange } = useProfileFilters();
  const { searchQuery, category: selectedCategory, includeExplicit, sortBy, minPrice, maxPrice } = filters;

  const { nfts, loading: nftsLoading } = useNFTs();
  const { collections, loading: collectionsLoading } = usePublicCollections();
  const { creators, loading: creatorsLoading, error: creatorsError } = useCreatorsPublic();

  // Create collections map for royalty lookup
  const collectionsById = useMemo(() => {
    const map = new Map();
    collections.forEach(collection => {
      map.set(collection.id, collection);
    });
    return map;
  }, [collections]);
  const { getLikeCount: getCollectionLikeCount } = useCollectionLikeCounts();

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
      if (selectedCategory !== 'all' && nft.category !== selectedCategory) {
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
      if (selectedCategory !== 'all' && collection.category !== selectedCategory) {
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

  // Feed combined price range to sidebar context (collections + NFTs)
  useEffect(() => {
    const allPrices = [
      ...filteredCollections.map(col => col.mint_price).filter(price => price && price > 0),
      ...filteredNFTs.map(nft => nft.price).filter(price => price && price > 0)
    ];

    if (allPrices.length > 0) {
      const minPriceInData = Math.min(...allPrices);
      const maxPriceInData = Math.max(...allPrices);
      setCurrentPriceRange({ min: minPriceInData, max: maxPriceInData });
    }
  }, [filteredCollections, filteredNFTs, setCurrentPriceRange]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Helmet>
        <title>Marketplace | ANIME.TOKEN Collections & NFTs</title>
        <meta name="description" content="Discover and collect ANIME.TOKEN collections and NFTs from the community. Browse, filter, and explore creators." />
        <link rel="canonical" href="/marketplace" />
      </Helmet>

      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Discover and collect unique digital art from the ANIME community</p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="explore" className="flex-1">Explore</TabsTrigger>
          <TabsTrigger value="creators" className="flex-1">Creators</TabsTrigger>
        </TabsList>

        {/* Explore Tab - Collections & NFTs */}
        <TabsContent value="explore" className="space-y-6">
          {/* Collections Section */}
          <Collapsible open={collectionsOpen} onOpenChange={setCollectionsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-2 hover:text-primary transition-colors">
                <h2 className="text-xl font-semibold text-left">
                  Collections ({filteredCollections.length})
                </h2>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {collectionsLoading ? (
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
                  filteredCollections.map((collection) => (
                     <CollectionCard
                       key={collection.id}
                       collection={{
                         ...collection,
                         image_url: collection.image_url || '/placeholder.svg',
                         items_redeemed: collection.items_redeemed || 0
                       }}
                       likeCount={getCollectionLikeCount(collection.id)}
                      onNavigate={() => setNavContext({ 
                        type: 'collection', 
                        items: filteredCollections.map(c => c.id), 
                        source: 'marketplace',
                        tab: 'collections-nfts'
                      })}
                    />
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No collections match your filters.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* NFTs Section */}
          <Collapsible open={nftsOpen} onOpenChange={setNftsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-2 hover:text-primary transition-colors">
                <h2 className="text-xl font-semibold text-left">
                  NFTs ({filteredNFTs.length})
                </h2>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform duration-200 ${nftsOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nftsLoading ? (
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
                  filteredNFTs.map((nft) => {
                    const collection = collectionsById.get(nft.collection_id);
                    const royaltyPercent = collection?.royalty_percentage;
                    const metaLeft = royaltyPercent && royaltyPercent > 0 ? `${royaltyPercent}% royalty` : undefined;
                    
                    return (
                      <NFTCard
                        key={nft.id}
                        nft={nft}
                        metaLeft={metaLeft}
                        onNavigate={() => setNavContext({ 
                          type: 'nft', 
                          items: filteredNFTs.map(n => n.id), 
                          source: 'marketplace',
                          tab: 'collections-nfts'
                        })}
                      />
                    );
                  })
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No NFTs match your filters.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="space-y-6">
          {creatorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : creatorsError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load creators: {creatorsError}</p>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No creators found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCardCompact
                  key={creator.creator_user_id}
                  creator={creator}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketplace;