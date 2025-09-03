import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MenuSelect, 
  MenuSelectContent, 
  MenuSelectItem, 
  MenuSelectTrigger, 
  MenuSelectValue,
  useMenuSelect 
} from '@/components/ui/menu-select';
import { Search, X } from 'lucide-react';
import { useMarketplaceFilters } from '@/contexts/MarketplaceFiltersContext';
import { cn } from '@/lib/utils';

interface MarketplaceFilterSidebarProps {
  className?: string;
  collapsed?: boolean;
  embedded?: boolean;
}

const categories = ['Art', 'Gaming', 'Music', 'Photography', 'Sports', 'Utility', 'Other'];

export const MarketplaceFilterSidebar = ({ className, collapsed, embedded }: MarketplaceFilterSidebarProps) => {
  const { filters, updateFilter, clearAllFilters } = useMarketplaceFilters();

  const hasActiveFilters = filters.searchQuery || 
    filters.category !== 'all' || 
    filters.sortBy !== 'newest' || 
    filters.includeExplicit || 
    filters.minPrice || 
    filters.maxPrice;

  if (collapsed) {
    return (
      <aside className={cn("w-16 border-r bg-sidebar-background", className)}>
        <div className="p-4">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
      </aside>
    );
  }

  if (embedded) {
    return (
      <div className="space-y-6 border-t pt-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Search & Filter</h3>
          <p className="text-sm text-muted-foreground">Find the perfect NFTs and collections</p>
        </div>
        <FilterContent />
      </div>
    );
  }

  return (
    <aside className={cn("w-64 border-r bg-sidebar-background p-4 space-y-6", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Search & Filter</h3>
        <p className="text-sm text-muted-foreground">Find the perfect NFTs and collections</p>
      </div>
      <FilterContent />
    </aside>
  );
};

const FilterContent = () => {
  const { filters, updateFilter, clearAllFilters } = useMarketplaceFilters();

  const hasActiveFilters = filters.searchQuery || 
    filters.category !== 'all' || 
    filters.sortBy !== 'newest' || 
    filters.includeExplicit || 
    filters.minPrice || 
    filters.maxPrice;

  return (
    <div className="space-y-6">

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search collections and NFTs..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <CategorySelect 
          value={filters.category}
          onValueChange={(value) => updateFilter('category', value)}
        />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <SortSelect 
          value={filters.sortBy}
          onValueChange={(value) => updateFilter('sortBy', value)}
        />
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range (SOL)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Input
              type="number" 
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Include Explicit */}
      <div className="flex items-center justify-between">
        <Label htmlFor="explicit" className="text-sm font-medium">Include Explicit Content</Label>
        <Switch
          id="explicit"
          checked={filters.includeExplicit}
          onCheckedChange={(checked) => updateFilter('includeExplicit', checked)}
        />
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Active Filters</Label>
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: {filters.searchQuery}
                <button
                  onClick={() => updateFilter('searchQuery', '')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Category: {filters.category}
                <button
                  onClick={() => updateFilter('category', 'all')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.includeExplicit && (
              <Badge variant="secondary" className="text-xs">
                Explicit Content
                <button
                  onClick={() => updateFilter('includeExplicit', false)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="text-xs">
                Price: {filters.minPrice || '0'} - {filters.maxPrice || '∞'}
                <button
                  onClick={() => {
                    updateFilter('minPrice', '');
                    updateFilter('maxPrice', '');
                  }}
                  className="ml-1 hover:bg-muted-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full"
          >
            <X className="h-3 w-3 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

// Category Select Component
const CategorySelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectState = useMenuSelect({ value, onValueChange });
  
  return (
    <MenuSelect onOpenChange={() => {}}>
      <MenuSelectTrigger className="w-full">
        <MenuSelectValue>{value === 'all' ? 'All categories' : value}</MenuSelectValue>
      </MenuSelectTrigger>
      <MenuSelectContent>
        <MenuSelectItem value="all" onSelect={() => selectState.onValueChange('all')}>
          All categories
        </MenuSelectItem>
        {categories.map((category) => (
          <MenuSelectItem 
            key={category} 
            value={category} 
            onSelect={() => selectState.onValueChange(category)}
          >
            {category}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
};

// Sort Select Component
const SortSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
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
    <MenuSelect onOpenChange={() => {}}>
      <MenuSelectTrigger className="w-full">
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
        <MenuSelectItem value="price-high" onSelect={() => selectState.onValueChange('price-high')}>
          Price High to Low
        </MenuSelectItem>
        <MenuSelectItem value="price-low" onSelect={() => selectState.onValueChange('price-low')}>
          Price Low to High
        </MenuSelectItem>
      </MenuSelectContent>
    </MenuSelect>
  );
};