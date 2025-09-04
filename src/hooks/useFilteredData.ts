
import { useMemo } from 'react';
import { FilterState } from '@/components/SearchFilterBar';
import { hasRequiredListingFields } from '@/lib/attributeHelpers';

interface NFT {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  is_listed: boolean;
  attributes?: any;
  created_at: string;
  creator_address: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  site_description?: string;
  category?: string;
  mint_price?: number;
  is_live: boolean;
  royalty_percentage?: number;
  explicit_content?: boolean;
  created_at: string;
  creator_address: string;
}

export const useFilteredNFTs = (
  nfts: NFT[],
  likedNFTs: NFT[],
  fromLikedCreators: NFT[],
  followedCreators: string[],
  filters: FilterState,
  getLikeCount: (id: string) => number
) => {
  return useMemo(() => {
    let sourceData: NFT[] = [];
    
    switch (filters.source) {
      case 'liked':
        sourceData = likedNFTs;
        break;
      case 'from-liked':
        sourceData = fromLikedCreators;
        break;
      default:
        sourceData = nfts;
    }

    let filtered = sourceData.filter(nft => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = nft.name.toLowerCase().includes(query);
        const matchesDescription = nft.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      // Category filter
      if (filters.category !== 'all' && nft.category !== filters.category) {
        return false;
      }

      // Explicit content filter
      if (!filters.includeExplicit && nft.attributes?.explicit_content) {
        return false;
      }

      // Listing filter (only for profile)
      if (filters.listing && filters.listing !== 'all') {
        const isListed = nft.is_listed && hasRequiredListingFields(nft);
        if (filters.listing === 'listed' && !isListed) return false;
        if (filters.listing === 'not-listed' && isListed) return false;
      }

      // Price filters
      if (filters.minPrice && (nft.price || 0) < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && (nft.price || 0) > parseFloat(filters.maxPrice)) {
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
          return getLikeCount(b.id) - getLikeCount(a.id);
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [nfts, likedNFTs, fromLikedCreators, filters, getLikeCount]);
};

export const useFilteredCollections = (
  collections: Collection[],
  likedCollections: Collection[],
  fromLikedCreators: Collection[],
  followedCreators: string[],
  filters: FilterState,
  getLikeCount: (id: string) => number
) => {
  return useMemo(() => {
    let sourceData: Collection[] = [];
    
    switch (filters.source) {
      case 'liked':
        sourceData = likedCollections;
        break;
      case 'from-liked':
        sourceData = fromLikedCreators;
        break;
      default:
        sourceData = collections;
    }

    let filtered = sourceData.filter(collection => {
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
      if (filters.minPrice && (collection.mint_price || 0) < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && (collection.mint_price || 0) > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Royalty filters
      if (filters.minRoyalty && (collection.royalty_percentage || 0) < parseFloat(filters.minRoyalty)) {
        return false;
      }
      if (filters.maxRoyalty && (collection.royalty_percentage || 0) > parseFloat(filters.maxRoyalty)) {
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
          return getLikeCount(b.id) - getLikeCount(a.id);
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [collections, likedCollections, fromLikedCreators, filters, getLikeCount]);
};
