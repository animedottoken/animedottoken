import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Collection } from '@/types/collection';

export const useCollection = (collectionId: string) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Use the secure function to get collection details with appropriate wallet masking
      const { data, error } = await supabase
        .rpc('get_collection_details', { collection_id: collectionId });

      if (error) {
        setError(error.message);
        setCollection(null);
      } else if (data && data.length > 0) {
        // Cast the data to Collection type safely
        setCollection(data[0] as Collection);
        setError(null);
      } else {
        setError('Collection not found');
        setCollection(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCollection(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const refreshCollection = (silent = false) => {
    loadCollection(silent);
  };

  return {
    collection,
    loading,
    error,
    refreshCollection
  };
};