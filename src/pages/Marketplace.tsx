import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNFTs } from "@/hooks/useNFTs";
import { usePublicCollections } from "@/hooks/usePublicCollections";
import { NFTCard } from "@/components/NFTCard";
import { CollectionCard } from "@/components/CollectionCard";
import { hasRequiredListingFields } from '@/lib/attributeHelpers';
import { setNavContext } from "@/lib/navContext";
import { useMarketplaceFilters } from '@/contexts/MarketplaceFiltersContext';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

const MarketplaceContent = () => {
  const navigate = useNavigate();
  const { filters, updateFilter } = useMarketplaceFilters();

  const { nfts, loading: nftsLoading } = useNFTs();
  const { collections, loading: collectionsLoading } = usePublicCollections();

  // Filter and paginate NFTs
  const { paginatedNFTs, totalNFTPages } = useMemo(() => {
    if (nftsLoading || !nfts) return { paginatedNFTs: [], totalNFTPages: 0 };
    
    let filtered = nfts.filter(nft => {
      // Marketplace must only show listed NFTs with all required fields
      if (!nft.is_listed || !hasRequiredListingFields(nft)) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!nft.name.toLowerCase().includes(query) && !nft.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && nft.category !== filters.category) {
        return false;
      }

      // Explicit content filter
      if (!filters.includeExplicit && nft.attributes?.explicit_content) {
        return false;
      }

      // Price filters
      if (filters.minPrice && nft.price && nft.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && nft.price && nft.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'likes':
          return 0; // TODO: Add like functionality
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    // Paginate
    const totalPages = Math.ceil(filtered.length / filters.itemsPerPage);
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + filters.itemsPerPage);

    return { paginatedNFTs: paginated, totalNFTPages: totalPages };
  }, [nfts, filters, nftsLoading]);

  // Filter and paginate Collections
  const { paginatedCollections, totalCollectionPages } = useMemo(() => {
    if (collectionsLoading || !collections) return { paginatedCollections: [], totalCollectionPages: 0 };
    
    let filtered = collections.filter(collection => {
      // Marketplace must only show live collections that are active
      if (!collection.is_active || !collection.is_live) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = collection.name.toLowerCase().includes(query);
        const matchesDescription = collection.description?.toLowerCase().includes(query) ||
                                 collection.site_description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Category filter
      if (filters.category !== 'all' && collection.category !== filters.category) {
        return false;
      }

      // Explicit content filter
      if (!filters.includeExplicit && collection.explicit_content) {
        return false;
      }

      // Price filters (mint price)
      if (filters.minPrice && collection.mint_price && collection.mint_price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && collection.mint_price && collection.mint_price > parseFloat(filters.maxPrice)) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price-high':
          return (b.mint_price || 0) - (a.mint_price || 0);
        case 'price-low':
          return (a.mint_price || 0) - (b.mint_price || 0);
        case 'likes':
          return 0; // TODO: Add like functionality
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    // Paginate
    const totalPages = Math.ceil(filtered.length / filters.itemsPerPage);
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + filters.itemsPerPage);

    return { paginatedCollections: paginated, totalCollectionPages: totalPages };
  }, [collections, filters, collectionsLoading]);

  const handleTabChange = (tab: 'collections' | 'nfts') => {
    updateFilter('activeTab', tab);
    updateFilter('currentPage', 1); // Reset to first page when switching tabs
  };

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
      <Tabs value={filters.activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="collections" className="flex-1">
            Collections ({paginatedCollections?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="nfts" className="flex-1">
            NFTs ({paginatedNFTs?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          {/* Collections Grid - 4 columns, 6 rows = 24 items per page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collectionsLoading ? (
              Array.from({ length: 24 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : paginatedCollections.length > 0 ? (
              paginatedCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={{
                    ...collection,
                    image_url: collection.image_url || '/placeholder.svg',
                    creator_address_masked: collection.creator_address,
                    items_redeemed: collection.items_redeemed || 0
                  }}
                  onNavigate={() => setNavContext({ type: 'collection', items: paginatedCollections.map(c => c.id), source: 'marketplace' })}
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

          {/* Collections Pagination */}
          {totalCollectionPages > 1 && (
            <MarketplacePagination 
              currentPage={filters.currentPage}
              totalPages={totalCollectionPages}
              onPageChange={(page) => updateFilter('currentPage', page)}
            />
          )}
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-6">
          {/* NFT Grid - 4 columns, 6 rows = 24 items per page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nftsLoading ? (
              Array.from({ length: 24 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : paginatedNFTs.length > 0 ? (
              paginatedNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onNavigate={() => setNavContext({ type: 'nft', items: paginatedNFTs.map(n => n.id), source: 'marketplace' })}
                />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No NFTs match your filters.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* NFT Pagination */}
          {totalNFTPages > 1 && (
            <MarketplacePagination 
              currentPage={filters.currentPage}
              totalPages={totalNFTPages}
              onPageChange={(page) => updateFilter('currentPage', page)}
            />
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};

// Pagination Component
interface MarketplacePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MarketplacePagination = ({ currentPage, totalPages, onPageChange }: MarketplacePaginationProps) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <Pagination className="justify-center">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        
        {getVisiblePages().map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

// Main Marketplace Component without internal Provider (uses global FiltersScope)
const Marketplace = () => {
  return <MarketplaceContent />;
};

export default Marketplace;
