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
    // Use wallet-specific storage when connected, fallback to general storage
    const storageKey = publicKey ? `favorites_${publicKey}` : 'favorites_anonymous';
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
    const favorite: Favorite = {
      ...item,
      added_at: new Date().toISOString()
    };

    const storageKey = publicKey ? `favorites_${publicKey}` : 'favorites_anonymous';
    const updated = [...favorites, favorite];
    setFavorites(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [publicKey, favorites]);

  const removeFromFavorites = useCallback((itemId: string) => {
    const storageKey = publicKey ? `favorites_${publicKey}` : 'favorites_anonymous';
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