import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '@/components/SearchFilterBar';

interface PriceRange {
  min?: number;
  max?: number;
}

interface RoyaltyRange {
  min?: number;
  max?: number;
}

interface ProfileFiltersContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  currentPriceRange?: PriceRange;
  setCurrentPriceRange: (range?: PriceRange) => void;
  currentRoyaltyRange?: RoyaltyRange;
  setCurrentRoyaltyRange: (range?: RoyaltyRange) => void;
}

const ProfileFiltersContext = createContext<ProfileFiltersContextType | undefined>(undefined);

export const useProfileFilters = () => {
  const context = useContext(ProfileFiltersContext);
  if (context === undefined) {
    throw new Error('useProfileFilters must be used within a ProfileFiltersProvider');
  }
  return context;
};

interface ProfileFiltersProviderProps {
  children: ReactNode;
}

export const ProfileFiltersProvider: React.FC<ProfileFiltersProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    source: 'all',
    sortBy: 'newest',
    includeExplicit: false,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    minRoyalty: '',
    maxRoyalty: '',
    marketplace: 'all',
    type: 'all'
  });

  const [currentPriceRange, setCurrentPriceRange] = useState<PriceRange | undefined>();
  const [currentRoyaltyRange, setCurrentRoyaltyRange] = useState<RoyaltyRange | undefined>();

  return (
    <ProfileFiltersContext.Provider value={{ 
      filters, 
      setFilters, 
      currentPriceRange, 
      setCurrentPriceRange,
      currentRoyaltyRange,
      setCurrentRoyaltyRange
    }}>
      {children}
    </ProfileFiltersContext.Provider>
  );
};