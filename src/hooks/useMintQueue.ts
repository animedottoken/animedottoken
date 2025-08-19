import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface MintJob {
  id: string;
  user_id: string;
  wallet_address: string;
  collection_id: string;
  total_quantity: number;
  completed_quantity: number;
  failed_quantity: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  total_cost: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MintJobItem {
  id: string;
  mint_job_id: string;
  batch_number: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  nft_mint_address?: string;
  transaction_signature?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobResult {
  success: boolean;
  jobId?: string;
  totalQuantity?: number;
  totalBatches?: number;
  totalCost?: number;
  collectionName?: string;
  estimatedTime?: string;
  error?: string;
}

export const useMintQueue = () => {
  const [jobs, setJobs] = useState<MintJob[]>([]);
  const [jobItems, setJobItems] = useState<Record<string, MintJobItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { publicKey } = useSolanaWallet();

  // Load user's mint jobs
  const loadJobs = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mint_jobs')
        .select('*')
        .eq('wallet_address', publicKey)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading jobs:', error);
        toast.error('Failed to load mint jobs');
        return;
      }

      setJobs((data || []) as MintJob[]);
      
      // Load items for each job
      if (data && data.length > 0) {
        const jobIds = data.map(job => job.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('mint_job_items')
          .select('*')
          .in('mint_job_id', jobIds)
          .order('batch_number');

        if (itemsError) {
          console.error('Error loading job items:', itemsError);
        } else {
          // Group items by job ID
          const groupedItems: Record<string, MintJobItem[]> = {};
          itemsData?.forEach(item => {
            if (!groupedItems[item.mint_job_id]) {
              groupedItems[item.mint_job_id] = [];
            }
            groupedItems[item.mint_job_id].push(item as MintJobItem);
          });
          setJobItems(groupedItems);
        }
      }
    } catch (error) {
      console.error('Unexpected error loading jobs:', error);
      toast.error('Failed to load mint jobs');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Create new mint job
  const createMintJob = async (
    collectionId: string, 
    quantity: number
  ): Promise<CreateJobResult> => {
    if (!publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mint-job', {
        body: {
          collectionId,
          quantity,
          walletAddress: publicKey
        }
      });

      if (error) {
        console.error('Error creating mint job:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to create mint job' 
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to create mint job'
        };
      }

      // Refresh jobs list immediately and after a short delay
      await loadJobs();
      setTimeout(() => loadJobs(), 1000);

      toast.success(
        `Mint job created! ${data.totalQuantity} NFTs queued for minting.`,
        {
          description: `Estimated time: ${data.estimatedTime}`
        }
      );

      return {
        success: true,
        jobId: data.jobId,
        totalQuantity: data.totalQuantity,
        totalBatches: data.totalBatches,
        totalCost: data.totalCost,
        collectionName: data.collectionName,
        estimatedTime: data.estimatedTime
      };

    } catch (error) {
      console.error('Unexpected error creating mint job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setCreating(false);
    }
  };

  // Get job progress
  const getJobProgress = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    const items = jobItems[jobId] || [];
    const completedItems = items.filter(item => item.status === 'completed');
    const failedItems = items.filter(item => item.status === 'failed');
    const processingItems = items.filter(item => item.status === 'processing');
    
    const progressPercentage = job.total_quantity > 0 
      ? (job.completed_quantity / job.total_quantity) * 100 
      : 0;

    return {
      job,
      items,
      completedItems: completedItems.length,
      failedItems: failedItems.length,
      processingItems: processingItems.length,
      pendingItems: job.total_quantity - job.completed_quantity - job.failed_quantity,
      progressPercentage,
      isCompleted: job.status === 'completed',
      isFailed: job.status === 'failed',
      isProcessing: job.status === 'processing'
    };
  }, [jobs, jobItems]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!publicKey) return;

    // Subscribe to mint_jobs changes for this wallet
    const jobsChannel = supabase
      .channel('mint-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mint_jobs',
          filter: `wallet_address=eq.${publicKey}`
        },
        (payload) => {
          console.log('Job update:', payload);
          loadJobs(); // Refresh jobs on any change
        }
      )
      .subscribe();

    // Subscribe to mint_job_items changes (no filter needed since we filter by wallet in loadJobs)
    const itemsChannel = supabase
      .channel('mint-job-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mint_job_items'
        },
        (payload) => {
          console.log('Job item update:', payload);
          loadJobs(); // Refresh jobs and items on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [publicKey, loadJobs]);

  // Load jobs on wallet connection
  useEffect(() => {
    if (publicKey) {
      loadJobs();
    } else {
      setJobs([]);
      setJobItems({});
    }
  }, [publicKey, loadJobs]);

  return {
    jobs,
    jobItems,
    loading,
    creating,
    createMintJob,
    getJobProgress,
    refreshJobs: loadJobs
  };
};