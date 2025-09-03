import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface MarketplaceFilterState {
  searchQuery: string;
  category: string;
  sortBy: 'newest' | 'oldest' | 'price-high' | 'price-low' | 'likes' | 'name-az' | 'name-za';
  includeExplicit: boolean;
  minPrice: string;
  maxPrice: string;
  activeTab: 'collections' | 'nfts';
  currentPage: number;
  itemsPerPage: number;
}

interface MarketplaceFiltersContextType {
  filters: MarketplaceFilterState;
  updateFilter: (key: keyof MarketplaceFilterState, value: any) => void;
  clearAllFilters: () => void;
  resetPagination: () => void;
}

const MarketplaceFiltersContext = createContext<MarketplaceFiltersContextType | undefined>(undefined);

const defaultFilters: MarketplaceFilterState = {
  searchQuery: '',
  category: 'all',
  sortBy: 'newest',
  includeExplicit: false,
  minPrice: '',
  maxPrice: '',
  activeTab: 'collections',
  currentPage: 1,
  itemsPerPage: 24, // 4 columns × 6 rows
};

export const MarketplaceFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<MarketplaceFilterState>(defaultFilters);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const urlFilters: Partial<MarketplaceFilterState> = {};
    
    if (searchParams.get('q')) urlFilters.searchQuery = searchParams.get('q')!;
    if (searchParams.get('category')) urlFilters.category = searchParams.get('category')!;
    if (searchParams.get('sort')) urlFilters.sortBy = searchParams.get('sort') as any;
    if (searchParams.get('explicit') === 'true') urlFilters.includeExplicit = true;
    if (searchParams.get('min')) urlFilters.minPrice = searchParams.get('min')!;
    if (searchParams.get('max')) urlFilters.maxPrice = searchParams.get('max')!;
    if (searchParams.get('tab')) urlFilters.activeTab = searchParams.get('tab') as any;
    if (searchParams.get('page')) urlFilters.currentPage = parseInt(searchParams.get('page')!) || 1;

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, []);

  // Update URL params when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams();
      
      if (filters.searchQuery) newParams.set('q', filters.searchQuery);
      if (filters.category !== 'all') newParams.set('category', filters.category);
      if (filters.sortBy !== 'newest') newParams.set('sort', filters.sortBy);
      if (filters.includeExplicit) newParams.set('explicit', 'true');
      if (filters.minPrice) newParams.set('min', filters.minPrice);
      if (filters.maxPrice) newParams.set('max', filters.maxPrice);
      if (filters.activeTab !== 'collections') newParams.set('tab', filters.activeTab);
      if (filters.currentPage > 1) newParams.set('page', filters.currentPage.toString());

      setSearchParams(newParams, { replace: true });
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, setSearchParams]);

  const updateFilter = (key: keyof MarketplaceFilterState, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset to first page when changing filters (except when changing page directly)
      if (key !== 'currentPage' && key !== 'activeTab') {
        newFilters.currentPage = 1;
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  const resetPagination = () => {
    setFilters(prev => ({ ...prev, currentPage: 1 }));
  };

  return (
    <MarketplaceFiltersContext.Provider value={{
      filters,
      updateFilter,
      clearAllFilters,
      resetPagination
    }}>
      {children}
    </MarketplaceFiltersContext.Provider>
  );
};

export const useMarketplaceFilters = () => {
  const context = useContext(MarketplaceFiltersContext);
  if (context === undefined) {
    throw new Error('useMarketplaceFilters must be used within a MarketplaceFiltersProvider');
  }
  return context;
};