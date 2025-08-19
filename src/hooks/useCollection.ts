import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Collection {
  id: string;
  name: string;
  symbol?: string;
  description?: string;
  image_url?: string;
  banner_image_url?: string;
  mint_price?: number;
  max_supply?: number;
  items_available?: number;
  items_redeemed?: number;
  is_active: boolean;
  is_live: boolean;
  whitelist_enabled?: boolean;
  go_live_date?: string | null;
  royalty_percentage?: number;
  creator_address: string;
  treasury_wallet?: string;
  slug?: string;
  external_links?: any;
  collection_mint_address?: string;
  verified?: boolean;
  category?: string;
  explicit_content?: boolean;
}

export const useCollection = (collectionId: string) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (error) {
        setError(error.message);
        setCollection(null);
      } else {
        setCollection(data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCollection(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshCollection = () => {
    loadCollection();
  };

  return {
    collection,
    loading,
    error,
    refreshCollection
  };
};