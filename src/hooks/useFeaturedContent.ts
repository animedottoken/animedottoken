import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedSubmission {
  id: string;
  image: string;
  caption: string;
  author: string;
  artist_nickname?: string;
  type: 'art' | 'meme' | 'story';
  position?: number;
  featured_at?: string;
}

export const useFeaturedContent = () => {
  return useQuery({
    queryKey: ['featured-content'],
    queryFn: async (): Promise<FeaturedSubmission[]> => {
      try {
        const { data, error } = await supabase.functions.invoke('get-featured-content');
        
        if (error) {
          console.error('Error fetching featured content:', error);
          throw new Error(error.message);
        }
        
        return data || [];
      } catch (err) {
        console.error('Failed to fetch featured content:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
};