import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicCollection {
  id: string;
  name: string;
  description?: string | null;
  site_description?: string | null;
  image_url?: string | null;
  banner_image_url?: string | null;
  creator_address: string;
  creator_nickname: string;
  creator_verified: boolean;
  category?: string | null;
  mint_price?: number | null;
  max_supply?: number | null;
  items_redeemed: number;
  is_active: boolean;
  is_live: boolean;
  explicit_content?: boolean | null;
  royalty_percentage?: number | null;
  verified?: boolean | null;
  created_at: string;
}

export const usePublicCollections = () => {
  const [collections, setCollections] = useState<PublicCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_collections_public_explore');

      if (error) {
        console.error('Error fetching public collections:', error);
        setError(error.message);
        return;
      }

      setCollections((data || []) as PublicCollection[]);
    } catch (err) {
      console.error('Error fetching public collections:', err);
      setError('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return { collections, loading, error, refetch: fetchCollections };
};