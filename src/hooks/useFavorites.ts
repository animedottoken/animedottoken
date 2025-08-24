import { useState, useEffect, useCallback } from 'react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
const FAVORITES_EVENT = 'favorites-updated';
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
    const updated = [...favorites.filter(f => f.id !== item.id), favorite];
    setFavorites(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: { key: storageKey } }));
  }, [publicKey, favorites]);

  const removeFromFavorites = useCallback((itemId: string) => {
    const storageKey = publicKey ? `favorites_${publicKey}` : 'favorites_anonymous';
    const updated = favorites.filter(fav => fav.id !== itemId);
    setFavorites(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: { key: storageKey } }));
  }, [publicKey, favorites]);

  const isFavorite = useCallback((itemId: string) => {
    return favorites.some(fav => fav.id === itemId);
  }, [favorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    const handler = () => {
      loadFavorites();
    };
    window.addEventListener(FAVORITES_EVENT, handler);
    return () => window.removeEventListener(FAVORITES_EVENT, handler);
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