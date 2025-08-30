
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

// Simple debounce function
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export interface FilterState {
  searchQuery: string;
  source: 'all' | 'liked' | 'from-liked';
  sortBy: 'newest' | 'oldest' | 'price-high' | 'price-low' | 'likes' | 'name-az' | 'name-za';
  includeExplicit: boolean;
  category: string;
  minPrice: string;
  maxPrice: string;
  minRoyalty: string;
  maxRoyalty: string;
  listing?: 'all' | 'listed' | 'not-listed'; // Only for profile NFTs
  type?: 'all' | 'collections' | 'nfts'; // New type filter for combined tab
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showListingFilter?: boolean;
  showPriceFilters?: boolean;
  showRoyaltyFilters?: boolean;
  showSourceFilter?: boolean;
  showTypeFilter?: boolean;
  placeholder?: string;
  categories?: string[];
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFiltersChange,
  showListingFilter = false,
  showPriceFilters = true,
  showRoyaltyFilters = true,
  showSourceFilter = true,
  showTypeFilter = false,
  placeholder = "Search NFTs and collections...",
  categories = ['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other']
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounced update to parent
  const debouncedUpdate = useCallback(
    debounce((newFilters: FilterState) => {
      onFiltersChange(newFilters);
    }, 300),
    [onFiltersChange]
  );

  useEffect(() => {
    debouncedUpdate(localFilters);
  }, [localFilters, debouncedUpdate]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchQuery: '',
      source: 'all',
      sortBy: 'newest',
      includeExplicit: false,
      category: 'all',
      minPrice: '',
      maxPrice: '',
      minRoyalty: '',
      maxRoyalty: '',
      ...(showListingFilter && { listing: 'all' }),
      ...(showTypeFilter && { type: 'all' })
    };
    setLocalFilters(clearedFilters);
  };

  const hasActiveFilters = localFilters.searchQuery || 
    localFilters.source !== 'all' || 
    localFilters.sortBy !== 'newest' || 
    localFilters.includeExplicit || 
    localFilters.category || 
    localFilters.minPrice || 
    localFilters.maxPrice || 
    localFilters.minRoyalty || 
    localFilters.maxRoyalty ||
    (showListingFilter && localFilters.listing !== 'all') ||
    (showTypeFilter && localFilters.type !== 'all');

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={localFilters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Primary Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {showTypeFilter && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <Select
              value={localFilters.type || 'all'}
              onValueChange={(value) => updateFilter('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="collections">Collections</SelectItem>
                <SelectItem value="nfts">NFTs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showSourceFilter && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source</Label>
            <Select
              value={localFilters.source}
              onValueChange={(value) => updateFilter('source', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="liked">Liked</SelectItem>
                <SelectItem value="from-liked">From Liked Creators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showListingFilter && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Listing Status</Label>
            <Select
              value={localFilters.listing || 'all'}
              onValueChange={(value) => updateFilter('listing', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="not-listed">Not Listed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Sort By</Label>
          <Select
            value={localFilters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="likes">Most Liked</SelectItem>
              <SelectItem value="name-az">Name A-Z</SelectItem>
              <SelectItem value="name-za">Name Z-A</SelectItem>
              {showPriceFilters && (
                <>
                  <SelectItem value="price-high">Price High to Low</SelectItem>
                  <SelectItem value="price-low">Price Low to High</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={localFilters.category}
            onValueChange={(value) => updateFilter('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Switch
            id="explicit"
            checked={localFilters.includeExplicit}
            onCheckedChange={(checked) => updateFilter('includeExplicit', checked)}
          />
          <Label htmlFor="explicit" className="text-sm">Include Explicit</Label>
        </div>

        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Price & Royalty Filters */}
      {(showPriceFilters || showRoyaltyFilters) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showPriceFilters && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min Price (SOL)</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={localFilters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Price (SOL)</Label>
                <Input
                  type="number"
                  placeholder="1000.0"
                  value={localFilters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                />
              </div>
            </>
          )}

          {showRoyaltyFilters && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min Royalty (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minRoyalty}
                  onChange={(e) => updateFilter('minRoyalty', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Royalty (%)</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={localFilters.maxRoyalty}
                  onChange={(e) => updateFilter('maxRoyalty', e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Active Filters Display - Always mounted to prevent height jumps */}
      <div className="flex flex-wrap gap-2 min-h-[24px]">
        {hasActiveFilters && (
          <>
          {localFilters.searchQuery && (
            <Badge variant="secondary" className="text-xs">
              Search: {localFilters.searchQuery}
            </Badge>
          )}
          {localFilters.source !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Source: {localFilters.source === 'liked' ? 'Liked' : 'From Liked Creators'}
            </Badge>
          )}
          {localFilters.category && (
            <Badge variant="secondary" className="text-xs">
              Category: {localFilters.category}
            </Badge>
          )}
          {localFilters.includeExplicit && (
            <Badge variant="secondary" className="text-xs">
              Explicit Content
            </Badge>
          )}
          {showListingFilter && localFilters.listing !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {localFilters.listing === 'listed' ? 'Listed' : 'Not Listed'}
            </Badge>
          )}
          {showTypeFilter && localFilters.type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Type: {localFilters.type === 'collections' ? 'Collections' : 'NFTs'}
            </Badge>
           )}
          </>
        )}
      </div>
    </div>
  );
};
