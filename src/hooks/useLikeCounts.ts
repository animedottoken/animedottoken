
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NFTLikeCount {
  nft_id: string;
  like_count: number;
}

interface CollectionLikeCount {
  collection_id: string;
  like_count: number;
}

export const useNFTLikeCounts = () => {
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikeCounts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_nft_like_counts_public');
        
        if (error) {
          console.error('Error fetching NFT like counts:', error);
          return;
        }

        const countsMap = new Map<string, number>();
        data?.forEach((item: NFTLikeCount) => {
          countsMap.set(item.nft_id, item.like_count);
        });
        
        setLikeCounts(countsMap);
      } catch (error) {
        console.error('Error fetching NFT like counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeCounts();
  }, []);

  const getLikeCount = (nftId: string): number => {
    return likeCounts.get(nftId) || 0;
  };

  return { getLikeCount, loading };
};

export const useCollectionLikeCounts = () => {
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikeCounts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_collection_like_counts_public');
        
        if (error) {
          console.error('Error fetching collection like counts:', error);
          return;
        }

        const countsMap = new Map<string, number>();
        data?.forEach((item: CollectionLikeCount) => {
          countsMap.set(item.collection_id, item.like_count);
        });
        
        setLikeCounts(countsMap);
      } catch (error) {
        console.error('Error fetching collection like counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeCounts();
  }, []);

  const getLikeCount = (collectionId: string): number => {
    return likeCounts.get(collectionId) || 0;
  };

  return { getLikeCount, loading };
};
