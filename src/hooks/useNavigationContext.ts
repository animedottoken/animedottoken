import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getNavContext } from '@/lib/navContext';

interface NavigationItem {
  id: string;
  type: 'collection' | 'nft';
}

export const useNavigationContext = (currentId: string, itemType: 'collection' | 'nft') => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [items, setItems] = useState<NavigationItem[]>([]);
  
  // Try to get from storage first, then fall back to URL params for legacy support
  const navContext = getNavContext(itemType);
  const legacyNavItems = searchParams.get('nav');
  const source = navContext?.source || searchParams.get('from') || '';

  useEffect(() => {
    let navigationItems: NavigationItem[] = [];
    
    // Priority: storage context > legacy URL params
    if (navContext?.items) {
      navigationItems = navContext.items.map((id: string) => ({
        id,
        type: itemType
      }));
    } else if (legacyNavItems) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(legacyNavItems));
        navigationItems = parsedItems.map((id: string) => ({
          id,
          type: itemType
        }));
        
        // Clean legacy URL by navigating without nav param
        if (navigationItems.length > 0) {
          const currentPath = window.location.pathname;
          const viewParam = searchParams.get('view');
          const cleanUrl = viewParam ? `${currentPath}?view=${viewParam}` : currentPath;
          navigate(cleanUrl, { replace: true });
        }
      } catch (error) {
        console.error('Error parsing navigation items:', error);
      }
    }
    
    setItems(navigationItems);
    const index = navigationItems.findIndex(item => item.id === currentId);
    setCurrentIndex(index);
  }, [navContext, legacyNavItems, currentId, itemType, navigate, searchParams]);

  const navigateToItem = useCallback((direction: 'prev' | 'next') => {
    if (items.length === 0 || currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    }

    const targetItem = items[newIndex];
    if (targetItem) {
      // Keep minimal URL - only preserve view param if present
      const viewParam = searchParams.get('view');
      const targetUrl = itemType === 'collection' 
        ? `/collection/${targetItem.id}${viewParam ? `?view=${viewParam}` : ''}`
        : `/nft/${targetItem.id}${viewParam ? `?view=${viewParam}` : ''}`;
      
      navigate(targetUrl);
    }
  }, [items, currentIndex, searchParams, itemType, navigate]);

  // Keyboard navigation (disabled when in fullscreen view)
  useEffect(() => {
    const isFullscreen = searchParams.get('view') === 'fs';
    if (isFullscreen) return; // Don't handle keyboard when in fullscreen
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!items.length || currentIndex === -1) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToItem('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToItem('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, currentIndex, searchParams, navigateToItem]);

  const canNavigate = items.length > 1;
  const hasPrev = canNavigate && items.length > 0;
  const hasNext = canNavigate && items.length > 0;

  return {
    canNavigate,
    hasPrev,
    hasNext,
    currentIndex: currentIndex + 1, // Display as 1-based
    totalItems: items.length,
    navigatePrev: () => navigateToItem('prev'),
    navigateNext: () => navigateToItem('next'),
    source
  };
};