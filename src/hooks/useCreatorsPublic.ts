import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfileFilters } from '@/contexts/ProfileFiltersContext';

export interface Creator {
  creator_user_id: string;
  nickname: string;
  profile_image_url?: string;
  verified: boolean;
  profile_rank: string;
  follower_count: number;
  nft_likes_count: number;
  collection_likes_count: number;
  total_likes_count: number;
  created_nft_count: number;
  created_collection_count: number;
}

export const useCreatorsPublic = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { filters } = useProfileFilters();
  const searchQuery = filters.searchQuery;

  const fetchCreators = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_creators_public_explore');

      if (error) {
        console.error('Error fetching creators:', error);
        setError(error.message);
        return;
      }

      setCreators(data || []);
    } catch (err) {
      console.error('Error fetching creators:', err);
      setError('Failed to fetch creators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    if (!searchQuery) return creators;
    
    return creators.filter(creator => 
      creator.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [creators, searchQuery]);

  return {
    creators: filteredCreators,
    loading,
    error,
    refetch: fetchCreators
  };
};