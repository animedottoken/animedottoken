
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { 
  MenuSelect, 
  MenuSelectContent, 
  MenuSelectItem, 
  MenuSelectTrigger, 
  MenuSelectValue,
  useMenuSelect 
} from '@/components/ui/menu-select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  marketplace?: 'all' | 'yes' | 'no'; // Only for profile NFTs
  type?: 'all' | 'collections' | 'nfts'; // New type filter for combined tab
  mediaType?: 'all' | 'static' | 'video' | 'audio' | '3d' | 'animated'; // Media type filter for NFTs
}

interface PriceRange {
  min?: number;
  max?: number;
}

interface RoyaltyRange {
  min?: number;
  max?: number;
}

interface SearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showMarketplaceFilter?: boolean;
  showPriceFilters?: boolean;
  showRoyaltyFilters?: boolean;
  showSourceFilter?: boolean;
  showTypeFilter?: boolean;
  showMediaTypeFilter?: boolean;
  placeholder?: string;
  categories?: string[];
  collapsible?: boolean;
  currentPriceRange?: PriceRange;
  currentRoyaltyRange?: RoyaltyRange;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFiltersChange,
  showMarketplaceFilter = false,
  showPriceFilters = true,
  showRoyaltyFilters = true,
  showSourceFilter = true,
  showTypeFilter = false,
  showMediaTypeFilter = false,
  placeholder = "Full-text search...",
  categories = ['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other', 'No category'],
  collapsible = false,
  currentPriceRange,
  currentRoyaltyRange
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoPriceSync, setAutoPriceSync] = useState({ min: true, max: true });
  const [autoRoyaltySync, setAutoRoyaltySync] = useState({ min: true, max: true });

  // Auto-sync price and royalty values when ranges change and clear when no results
  useEffect(() => {
    if (currentPriceRange === undefined) {
      // Clear price fields when no results only if auto-sync is enabled
      if (autoPriceSync.min && localFilters.minPrice === '') {
        setLocalFilters(prev => ({ ...prev, minPrice: '' }));
      }
      if (autoPriceSync.max && localFilters.maxPrice === '') {
        setLocalFilters(prev => ({ ...prev, maxPrice: '' }));
      }
    } else {
      // Update with live values only if auto-sync is enabled AND field is empty
      if (autoPriceSync.min && localFilters.minPrice === '') {
        setLocalFilters(prev => ({ ...prev, minPrice: currentPriceRange.min?.toString() || '' }));
      }
      if (autoPriceSync.max && localFilters.maxPrice === '') {
        setLocalFilters(prev => ({ ...prev, maxPrice: currentPriceRange.max?.toString() || '' }));
      }
    }
  }, [currentPriceRange, autoPriceSync.min, autoPriceSync.max]);

  useEffect(() => {
    if (currentRoyaltyRange === undefined) {
      // Clear royalty fields when no results only if auto-sync is enabled
      if (autoRoyaltySync.min && localFilters.minRoyalty === '') {
        setLocalFilters(prev => ({ ...prev, minRoyalty: '' }));
      }
      if (autoRoyaltySync.max && localFilters.maxRoyalty === '') {
        setLocalFilters(prev => ({ ...prev, maxRoyalty: '' }));
      }
    } else {
      // Update with live values only if auto-sync is enabled AND field is empty
      if (autoRoyaltySync.min && localFilters.minRoyalty === '') {
        setLocalFilters(prev => ({ ...prev, minRoyalty: currentRoyaltyRange.min?.toString() || '' }));
      }
      if (autoRoyaltySync.max && localFilters.maxRoyalty === '') {
        setLocalFilters(prev => ({ ...prev, maxRoyalty: currentRoyaltyRange.max?.toString() || '' }));
      }
    }
  }, [currentRoyaltyRange, autoRoyaltySync.min, autoRoyaltySync.max]);

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
      ...(showMarketplaceFilter && { marketplace: 'all' }),
      ...(showTypeFilter && { type: 'all' }),
      ...(showMediaTypeFilter && { mediaType: 'all' })
    };
    setLocalFilters(clearedFilters);
    setAutoPriceSync({ min: false, max: false });
    setAutoRoyaltySync({ min: false, max: false });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    updateFilter(field, value);
    // Disable auto-sync when user starts typing
    if (field === 'minPrice') {
      setAutoPriceSync(prev => ({ ...prev, min: false }));
    } else {
      setAutoPriceSync(prev => ({ ...prev, max: false }));
    }
  };

  const handlePriceBlur = (field: 'minPrice' | 'maxPrice', value: string) => {
    // Validate price values to ensure min <= max
    if (value !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        // Ensure min <= max
        const currentMin = parseFloat(localFilters.minPrice || '0');
        const currentMax = parseFloat(localFilters.maxPrice || '999999');
        
        if (field === 'minPrice' && numValue > currentMax && localFilters.maxPrice) {
          updateFilter('maxPrice', numValue.toString());
        } else if (field === 'maxPrice' && numValue < currentMin && localFilters.minPrice) {
          updateFilter('minPrice', numValue.toString());
        }
      }
    }
    
    // Re-enable auto-sync only if field is completely empty
    if (value === '') {
      if (field === 'minPrice') {
        setAutoPriceSync(prev => ({ ...prev, min: true }));
      } else {
        setAutoPriceSync(prev => ({ ...prev, max: true }));
      }
    }
  };

  const handleRoyaltyChange = (field: 'minRoyalty' | 'maxRoyalty', value: string) => {
    updateFilter(field, value);
    // Disable auto-sync when user starts typing
    if (field === 'minRoyalty') {
      setAutoRoyaltySync(prev => ({ ...prev, min: false }));
    } else {
      setAutoRoyaltySync(prev => ({ ...prev, max: false }));
    }
  };

  const handleRoyaltyBlur = (field: 'minRoyalty' | 'maxRoyalty', value: string) => {
    // Validate and clamp royalty values
    if (value !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Clamp between 0-50
        const clampedValue = Math.max(0, Math.min(50, numValue));
        if (clampedValue !== numValue) {
          updateFilter(field, clampedValue.toString());
        }
        
        // Ensure min <= max
        const currentMin = parseFloat(localFilters.minRoyalty || '0');
        const currentMax = parseFloat(localFilters.maxRoyalty || '50');
        
        if (field === 'minRoyalty' && clampedValue > currentMax && localFilters.maxRoyalty) {
          updateFilter('maxRoyalty', clampedValue.toString());
        } else if (field === 'maxRoyalty' && clampedValue < currentMin && localFilters.minRoyalty) {
          updateFilter('minRoyalty', clampedValue.toString());
        }
      }
    }
    
    // Re-enable auto-sync only if field is completely empty
    if (value === '') {
      if (field === 'minRoyalty') {
        setAutoRoyaltySync(prev => ({ ...prev, min: true }));
      } else {
        setAutoRoyaltySync(prev => ({ ...prev, max: true }));
      }
    }
  };

  const clearIndividualFilter = (filterKey: keyof FilterState) => {
    switch (filterKey) {
      case 'searchQuery':
        updateFilter('searchQuery', '');
        break;
      case 'source':
        updateFilter('source', 'all');
        break;
      case 'category':
        updateFilter('category', 'all');
        break;
      case 'sortBy':
        updateFilter('sortBy', 'newest');
        break;
      case 'includeExplicit':
        updateFilter('includeExplicit', false);
        break;
      case 'marketplace':
        updateFilter('marketplace', 'all');
        break;
      case 'type':
        updateFilter('type', 'all');
        break;
      case 'mediaType':
        updateFilter('mediaType', 'all');
        break;
      case 'minPrice':
        updateFilter('minPrice', '');
        setAutoPriceSync(prev => ({ ...prev, min: false }));
        break;
      case 'maxPrice':
        updateFilter('maxPrice', '');
        setAutoPriceSync(prev => ({ ...prev, max: false }));
        break;
      case 'minRoyalty':
        updateFilter('minRoyalty', '');
        setAutoRoyaltySync(prev => ({ ...prev, min: false }));
        break;
      case 'maxRoyalty':
        updateFilter('maxRoyalty', '');
        setAutoRoyaltySync(prev => ({ ...prev, max: false }));
        break;
    }
  };

  const hasActiveFilters = localFilters.searchQuery || 
    localFilters.source !== 'all' || 
    localFilters.includeExplicit || 
    (localFilters.category && localFilters.category !== 'all') || 
    localFilters.minPrice || 
    localFilters.maxPrice || 
    localFilters.minRoyalty || 
    localFilters.maxRoyalty ||
    (showMarketplaceFilter && localFilters.marketplace !== 'all') ||
    (showTypeFilter && localFilters.type !== 'all') ||
    (showMediaTypeFilter && localFilters.mediaType !== 'all');

  // Always show selected filters section since we always show sort
  const shouldShowSelectedFilters = hasActiveFilters || true;

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      {/* Always show Search & Filter header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Search & Filter</h3>
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                Hide <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Selected Filters Summary and Clear All */}
      {shouldShowSelectedFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Selected filters:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="text-xs font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive border-destructive/20 h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localFilters.searchQuery && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Fulltext: {localFilters.searchQuery}
                <button 
                  onClick={() => clearIndividualFilter('searchQuery')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.source !== 'all' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Source: {localFilters.source === 'liked' ? 'Liked' : 'From Liked Creators'}
                <button 
                  onClick={() => clearIndividualFilter('source')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.category && localFilters.category !== 'all' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Category: {localFilters.category}
                <button 
                  onClick={() => clearIndividualFilter('category')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {/* Always show sort, but only deletable if not newest */}
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              Sort: {localFilters.sortBy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {localFilters.sortBy !== 'newest' && (
                <button 
                  onClick={() => clearIndividualFilter('sortBy')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
            {localFilters.includeExplicit && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Explicit Content
                <button 
                  onClick={() => clearIndividualFilter('includeExplicit')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {!localFilters.includeExplicit && (
              <Badge variant="outline" className="text-xs">
                Explicit hidden
              </Badge>
            )}
            {showMarketplaceFilter && localFilters.marketplace !== 'all' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Marketplace: {localFilters.marketplace === 'yes' ? 'Yes' : 'No'}
                <button 
                  onClick={() => clearIndividualFilter('marketplace')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {showTypeFilter && localFilters.type !== 'all' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Type: {localFilters.type === 'collections' ? 'Collections' : 'NFTs'}
                <button 
                  onClick={() => clearIndividualFilter('type')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {showMediaTypeFilter && localFilters.mediaType !== 'all' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Media: {localFilters.mediaType === 'static' ? 'Static Images' : 
                        localFilters.mediaType === 'video' ? 'Video' :
                        localFilters.mediaType === 'audio' ? 'Audio' :
                        localFilters.mediaType === '3d' ? '3D/AR' : 'Animated'}
                <button 
                  onClick={() => clearIndividualFilter('mediaType')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.minPrice && !autoPriceSync.min && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Min Price: {localFilters.minPrice} SOL
                <button 
                  onClick={() => clearIndividualFilter('minPrice')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.maxPrice && !autoPriceSync.max && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Max Price: {localFilters.maxPrice} SOL
                <button 
                  onClick={() => clearIndividualFilter('maxPrice')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.minRoyalty && !autoRoyaltySync.min && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Min Royalty: {localFilters.minRoyalty}%
                <button 
                  onClick={() => clearIndividualFilter('minRoyalty')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.maxRoyalty && !autoRoyaltySync.max && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                Max Royalty: {localFilters.maxRoyalty}%
                <button 
                  onClick={() => clearIndividualFilter('maxRoyalty')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* Search Bar - Show if not collapsible or if expanded */}
      {(!collapsible || isExpanded) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Full-text search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={placeholder}
              value={localFilters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Primary Filters - Each on its own row */}
      <div className="space-y-4">
        {showTypeFilter && (
          <TypeFilterSelect 
            value={localFilters.type || 'all'}
            onValueChange={(value) => updateFilter('type', value)}
          />
        )}

        {showSourceFilter && (
          <SourceFilterSelect 
            value={localFilters.source}
            onValueChange={(value) => updateFilter('source', value)}
          />
        )}

        {showMarketplaceFilter && (
          <MarketplaceFilterSelect 
            value={localFilters.marketplace || 'all'}
            onValueChange={(value) => updateFilter('marketplace', value)}
          />
        )}

        <SortByFilterSelect 
          value={localFilters.sortBy}
          onValueChange={(value) => updateFilter('sortBy', value)}
          showPriceFilters={showPriceFilters}
        />

        <CategoryFilterSelect 
          value={localFilters.category}
          onValueChange={(value) => updateFilter('category', value)}
          categories={categories}
        />

        {showMediaTypeFilter && (
          <div className="space-y-1">
            <MediaTypeFilterSelect 
              value={localFilters.mediaType || 'all'}
              onValueChange={(value) => updateFilter('mediaType', value)}
            />
            <p className="text-xs text-muted-foreground px-3">Applies to NFTs only</p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="explicit"
            checked={localFilters.includeExplicit}
            onCheckedChange={(checked) => updateFilter('includeExplicit', checked)}
          />
          <Label htmlFor="explicit" className="text-sm">Include Explicit</Label>
        </div>
      </div>

      {/* Price & Royalty Filters - Each on its own row */}
      {(!collapsible || isExpanded) && (showPriceFilters || showRoyaltyFilters) && (
        <div className="space-y-4">
          {showPriceFilters && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min Price (SOL)</Label>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder={
                    !autoPriceSync.min ? "" : 
                    currentPriceRange ? currentPriceRange.min?.toString() || "0" : 
                    "e.g. 0"
                  }
                  value={localFilters.minPrice}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                  onBlur={(e) => handlePriceBlur('minPrice', e.target.value)}
                  className={`max-w-xs ${
                    autoPriceSync.min && currentPriceRange === undefined ? "text-muted-foreground" : ""
                  }`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Price (SOL)</Label>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder={
                    !autoPriceSync.max ? "" : 
                    currentPriceRange ? currentPriceRange.max?.toString() || "0" : 
                    "e.g. 50"
                  }
                  value={localFilters.maxPrice}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                  onBlur={(e) => handlePriceBlur('maxPrice', e.target.value)}
                  className={`max-w-xs ${
                    autoPriceSync.max && currentPriceRange === undefined ? "text-muted-foreground" : ""
                  }`}
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
                  step="any"
                  inputMode="decimal"
                  placeholder={
                    !autoRoyaltySync.min ? "" : 
                    currentRoyaltyRange ? currentRoyaltyRange.min?.toString() || "0" : 
                    "e.g. 0"
                  }
                  value={localFilters.minRoyalty}
                  onChange={(e) => handleRoyaltyChange('minRoyalty', e.target.value)}
                  onBlur={(e) => handleRoyaltyBlur('minRoyalty', e.target.value)}
                  className={`max-w-xs ${
                    autoRoyaltySync.min && currentRoyaltyRange === undefined ? "text-muted-foreground" : ""
                  }`}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Royalty (%)</Label>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder={
                    !autoRoyaltySync.max ? "" : 
                    currentRoyaltyRange ? currentRoyaltyRange.max?.toString() || "0" : 
                    "e.g. 50"
                  }
                  value={localFilters.maxRoyalty}
                  onChange={(e) => handleRoyaltyChange('maxRoyalty', e.target.value)}
                  onBlur={(e) => handleRoyaltyBlur('maxRoyalty', e.target.value)}
                  className={`max-w-xs ${
                    autoRoyaltySync.max && currentRoyaltyRange === undefined ? "text-muted-foreground" : ""
                  }`}
                />
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};

// Individual filter components using MenuSelect
const TypeFilterSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Type</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>
            {value === 'all' ? 'All' : value === 'collections' ? 'Collections' : 'NFTs'}
          </MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
            All
          </MenuSelectItem>
          <MenuSelectItem value="collections" onSelect={() => selectState.onValueChange('collections')}>
            Collections
          </MenuSelectItem>
          <MenuSelectItem value="nfts" onSelect={() => selectState.onValueChange('nfts')}>
            NFTs
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};

const SourceFilterSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  const getDisplayText = (val: string) => {
    switch (val) {
      case 'liked': return 'Liked';
      case 'from-liked': return 'From Liked Creators';
      default: return 'All';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Source</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>{getDisplayText(value)}</MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
            All
          </MenuSelectItem>
          <MenuSelectItem value="liked" onSelect={() => selectState.onValueChange('liked')}>
            Liked
          </MenuSelectItem>
          <MenuSelectItem value="from-liked" onSelect={() => selectState.onValueChange('from-liked')}>
            From Liked Creators
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};

const MarketplaceFilterSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  const getDisplayText = (val: string) => {
    switch (val) {
      case 'yes': return 'Yes';
      case 'no': return 'No';
      default: return 'All';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Marketplace</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>{getDisplayText(value)}</MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
            All
          </MenuSelectItem>
          <MenuSelectItem value="yes" onSelect={() => selectState.onValueChange('yes')}>
            Yes
          </MenuSelectItem>
          <MenuSelectItem value="no" onSelect={() => selectState.onValueChange('no')}>
            No
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};

const SortByFilterSelect = ({ 
  value, 
  onValueChange, 
  showPriceFilters 
}: { 
  value: string; 
  onValueChange: (value: string) => void;
  showPriceFilters?: boolean;
}) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  const getDisplayText = (val: string) => {
    switch (val) {
      case 'oldest': return 'Oldest';
      case 'likes': return 'Most Liked';
      case 'name-az': return 'Name A-Z';
      case 'name-za': return 'Name Z-A';
      case 'price-high': return 'Price High to Low';
      case 'price-low': return 'Price Low to High';
      default: return 'Newest';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Sort By</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>{getDisplayText(value)}</MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="newest" onSelect={() => selectState.onValueChange('newest')}>
            Newest
          </MenuSelectItem>
          <MenuSelectItem value="oldest" onSelect={() => selectState.onValueChange('oldest')}>
            Oldest
          </MenuSelectItem>
          <MenuSelectItem value="likes" onSelect={() => selectState.onValueChange('likes')}>
            Most Liked
          </MenuSelectItem>
          <MenuSelectItem value="name-az" onSelect={() => selectState.onValueChange('name-az')}>
            Name A-Z
          </MenuSelectItem>
          <MenuSelectItem value="name-za" onSelect={() => selectState.onValueChange('name-za')}>
            Name Z-A
          </MenuSelectItem>
          {showPriceFilters && (
            <>
              <MenuSelectItem value="price-high" onSelect={() => selectState.onValueChange('price-high')}>
                Price High to Low
              </MenuSelectItem>
              <MenuSelectItem value="price-low" onSelect={() => selectState.onValueChange('price-low')}>
                Price Low to High
              </MenuSelectItem>
            </>
          )}
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};

const CategoryFilterSelect = ({ 
  value, 
  onValueChange, 
  categories 
}: { 
  value: string; 
  onValueChange: (value: string) => void;
  categories: string[];
}) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Category</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>
            {value === 'all' ? 'All categories' : value === 'no-category' ? 'No category' : value}
          </MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
            All categories
          </MenuSelectItem>
          {categories.filter(cat => cat !== 'No category').map((category) => (
            <MenuSelectItem 
              key={category} 
              value={category} 
              onSelect={() => selectState.onValueChange(category)}
            >
              {category}
            </MenuSelectItem>
          ))}
          <MenuSelectItem value="no-category" onSelect={() => selectState.onValueChange('no-category')}>
            No category
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};

const MediaTypeFilterSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  const getDisplayText = (val: string) => {
    switch (val) {
      case 'static': return 'Static Images';
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case '3d': return '3D/AR';
      case 'animated': return 'Animated';
      default: return 'All Media Types';
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Media Type</Label>
      <MenuSelect onOpenChange={() => {}}>
        <MenuSelectTrigger>
          <MenuSelectValue>{getDisplayText(value)}</MenuSelectValue>
        </MenuSelectTrigger>
        <MenuSelectContent>
          <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
            All Media Types
          </MenuSelectItem>
          <MenuSelectItem value="static" onSelect={() => selectState.onValueChange('static')}>
            Static Images
          </MenuSelectItem>
          <MenuSelectItem value="video" onSelect={() => selectState.onValueChange('video')}>
            Video
          </MenuSelectItem>
          <MenuSelectItem value="audio" onSelect={() => selectState.onValueChange('audio')}>
            Audio
          </MenuSelectItem>
          <MenuSelectItem value="3d" onSelect={() => selectState.onValueChange('3d')}>
            3D/AR
          </MenuSelectItem>
          <MenuSelectItem value="animated" onSelect={() => selectState.onValueChange('animated')}>
            Animated
          </MenuSelectItem>
        </MenuSelectContent>
      </MenuSelect>
    </div>
  );
};
