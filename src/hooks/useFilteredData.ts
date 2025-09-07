
import { useMemo } from 'react';
import { FilterState } from '@/components/SearchFilterBar';
import { normalizeAttributes } from '@/lib/attributes';
import { detectMediaKind, MediaKind } from '@/lib/media';

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
  owner_address: string;
  owner_nickname: string;
  owner_verified: boolean;
  creator_nickname: string;
  creator_verified: boolean;
  royalty_percentage?: number;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  site_description?: string;
  category?: string;
  mint_price?: number;
  is_live: boolean;
  is_active?: boolean;
  royalty_percentage?: number;
  explicit_content?: boolean;
  created_at: string;
  creator_address: string;
  creator_nickname: string;
  creator_verified: boolean;
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
      // Full-text search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = nft.name.toLowerCase().includes(query);
        const matchesDescription = nft.description?.toLowerCase().includes(query);
        
        // Search in attributes/properties
        let matchesAttributes = false;
        if (nft.attributes) {
          try {
            const normalizedAttrs = normalizeAttributes(nft.attributes);
            matchesAttributes = normalizedAttrs.some(attr => 
              attr.trait_type.toLowerCase().includes(query) ||
              attr.value.toLowerCase().includes(query)
            );
          } catch (error) {
            // Fallback for non-standard attribute formats
            const attrString = JSON.stringify(nft.attributes).toLowerCase();
            matchesAttributes = attrString.includes(query);
          }
        }
        
        if (!matchesName && !matchesDescription && !matchesAttributes) return false;
      }

      // Category filter
      if (filters.category !== 'all') {
        if (filters.category === 'no-category') {
          // Show NFTs with no category (null, undefined, empty string)
          if (nft.category && nft.category.trim() !== '') {
            return false;
          }
        } else {
          // Case-insensitive category matching
          const nftCategory = nft.category?.toLowerCase().trim() || '';
          const filterCategory = filters.category.toLowerCase().trim();
          if (nftCategory !== filterCategory) {
            return false;
          }
        }
      }

      // Explicit content filter
      if (!filters.includeExplicit && nft.attributes?.explicit_content) {
        return false;
      }

      // Marketplace filter (only for profile)
      if (filters.marketplace && filters.marketplace !== 'all') {
        const isOnMarketplace = nft.is_listed === true;
        if (filters.marketplace === 'yes' && !isOnMarketplace) return false;
        if (filters.marketplace === 'no' && isOnMarketplace) return false;
      }

      // Price filters
      if (filters.minPrice && (nft.price || 0) < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && (nft.price || 0) > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Royalty filters
      if (filters.minRoyalty && (nft.royalty_percentage || 0) < parseFloat(filters.minRoyalty)) {
        return false;
      }
      if (filters.maxRoyalty && (nft.royalty_percentage || 0) > parseFloat(filters.maxRoyalty)) {
        return false;
      }

      // Media type filter - using file extension detection
      if (filters.mediaType && filters.mediaType !== 'all') {
        const imageUrl = nft.attributes?.image_url || nft.attributes?.image;
        const animationUrl = nft.attributes?.animation_url || nft.attributes?.metadata?.animation_url;
        const mediaType = nft.attributes?.media_type || nft.attributes?.metadata?.media_type;
        
        const detectedKind = detectMediaKind(imageUrl, animationUrl, mediaType);
        
        if (filters.mediaType !== detectedKind) {
          return false;
        }
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
      if (filters.category !== 'all') {
        if (filters.category === 'no-category') {
          // Show collections with no category (null, undefined, empty string)
          if (collection.category && collection.category.trim() !== '') {
            return false;
          }
        } else {
          // Case-insensitive category matching
          const collectionCategory = collection.category?.toLowerCase().trim() || '';
          const filterCategory = filters.category.toLowerCase().trim();
          if (collectionCategory !== filterCategory) {
            return false;
          }
        }
      }

      // Explicit content filter
      if (!filters.includeExplicit && collection.explicit_content) {
        return false;
      }

      // Marketplace filter (only for profile)
      if (filters.marketplace && filters.marketplace !== 'all') {
        const isOnMarketplace = collection.is_live === true && collection.is_active === true;
        if (filters.marketplace === 'yes' && !isOnMarketplace) return false;
        if (filters.marketplace === 'no' && isOnMarketplace) return false;
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
