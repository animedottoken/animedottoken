import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '@/components/SearchFilterBar';

interface ProfileFiltersContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
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
    listing: 'all',
    type: 'all'
  });

  return (
    <ProfileFiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </ProfileFiltersContext.Provider>
  );
};