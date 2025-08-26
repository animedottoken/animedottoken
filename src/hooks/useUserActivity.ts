import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface Activity {
  id: string;
  type: 'collection_created' | 'mint_job_created' | 'mint_completed' | 'mint_failed';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  collection_name?: string;
  quantity?: number;
  price?: number;
}

export const useUserActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey } = useSolanaWallet();

  const loadActivities = useCallback(async () => {
    if (!publicKey) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);

      // Get collections created by user via direct collections table since they need to see their own data
      const { data: collections } = await supabase
        .from('collections')
        .select('id, name, created_at, mint_price')
        .eq('creator_address', publicKey)
        .order('created_at', { ascending: false });

      // Get mint jobs
      const { data: mintJobs } = await supabase
        .from('mint_jobs')
        .select(`
          id,
          status,
          total_quantity,
          total_cost,
          created_at,
          collection_id,
          collections (name)
        `)
        .eq('wallet_address', publicKey)
        .order('created_at', { ascending: false });

      const allActivities: Activity[] = [];

      // Add collection activities
      collections?.forEach(collection => {
        allActivities.push({
          id: `collection_${collection.id}`,
          type: 'collection_created',
          title: `Created Collection "${collection.name}"`,
          description: `New collection with ${collection.mint_price || 0} SOL mint price`,
          timestamp: collection.created_at,
          collection_name: collection.name,
          price: collection.mint_price || 0
        });
      });

      // Add mint job activities  
      mintJobs?.forEach(job => {
        const collectionName = (job as any).collections?.name || 'Unknown Collection';
        allActivities.push({
          id: `mint_job_${job.id}`,
          type: 'mint_job_created',
          title: `Mint Job Created`,
          description: `Queued ${job.total_quantity} NFTs from "${collectionName}"`,
          timestamp: job.created_at,
          status: job.status,
          collection_name: collectionName,
          quantity: job.total_quantity
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    refreshActivities: loadActivities
  };
};