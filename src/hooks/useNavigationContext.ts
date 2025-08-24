import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface NavigationItem {
  id: string;
  type: 'collection' | 'nft';
}

export const useNavigationContext = (currentId: string, itemType: 'collection' | 'nft') => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [items, setItems] = useState<NavigationItem[]>([]);
  
  const source = searchParams.get('from'); // 'collections', 'nfts', 'favorites', 'marketplace'
  const navItems = searchParams.get('nav'); // JSON encoded array of item IDs

  useEffect(() => {
    if (navItems) {
      try {
        const parsedItems = JSON.parse(decodeURIComponent(navItems));
        const navigationItems: NavigationItem[] = parsedItems.map((id: string) => ({
          id,
          type: itemType
        }));
        setItems(navigationItems);
        
        const index = navigationItems.findIndex(item => item.id === currentId);
        setCurrentIndex(index);
      } catch (error) {
        console.error('Error parsing navigation items:', error);
        setItems([]);
        setCurrentIndex(-1);
      }
    }
  }, [navItems, currentId, itemType]);

  const navigateToItem = (direction: 'prev' | 'next') => {
    if (items.length === 0 || currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    } else {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    }

    const targetItem = items[newIndex];
    if (targetItem) {
      const fromParam = source ? `from=${source}` : '';
      const navParam = `nav=${encodeURIComponent(JSON.stringify(items.map(item => item.id)))}`;
      const queryString = [fromParam, navParam].filter(Boolean).join('&');
      
      if (itemType === 'collection') {
        navigate(`/collection/${targetItem.id}?${queryString}`);
      } else {
        navigate(`/nft/${targetItem.id}?${queryString}`);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
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
  }, [items, currentIndex]);

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