import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MarketplaceFiltersProvider } from '@/contexts/MarketplaceFiltersContext';

interface FiltersScopeProps {
  children: ReactNode;
}

export const FiltersScope = ({ children }: FiltersScopeProps) => {
  const location = useLocation();
  
  // Routes that should have filter support
  const filterRoutes = ['/marketplace', '/profile'];
  const isCreatorProfileRoute = location.pathname.startsWith('/profile/');
  const shouldHaveFilters = filterRoutes.includes(location.pathname) || isCreatorProfileRoute;
  
  if (shouldHaveFilters) {
    return (
      <MarketplaceFiltersProvider>
        {children}
      </MarketplaceFiltersProvider>
    );
  }
  
  return <>{children}</>;
};