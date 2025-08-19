import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface Favorite {
  id: string;
  name: string;
  image_url?: string;
  collection_name?: string;
  type: 'nft' | 'collection';
  added_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  const loadFavorites = useCallback(() => {
    if (!publicKey) {
      setFavorites([]);
      return;
    }

    // For now, using localStorage until we implement proper favorites system
    const storageKey = `favorites_${publicKey}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing favorites:', error);
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, [publicKey]);

  const addToFavorites = useCallback((item: Omit<Favorite, 'added_at'>) => {
    if (!publicKey) return;

    const favorite: Favorite = {
      ...item,
      added_at: new Date().toISOString()
    };

    const storageKey = `favorites_${publicKey}`;
    const updated = [...favorites, favorite];
    setFavorites(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [publicKey, favorites]);

  const removeFromFavorites = useCallback((itemId: string) => {
    if (!publicKey) return;

    const storageKey = `favorites_${publicKey}`;
    const updated = favorites.filter(fav => fav.id !== itemId);
    setFavorites(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [publicKey, favorites]);

  const isFavorite = useCallback((itemId: string) => {
    return favorites.some(fav => fav.id === itemId);
  }, [favorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refreshFavorites: loadFavorites
  };
};