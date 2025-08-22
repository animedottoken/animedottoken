import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { toast } from 'sonner';

export interface DeleteCollectionResult {
  success: boolean;
  error?: string;
}

export const useDeleteCollection = () => {
  const [deleting, setDeleting] = useState(false);
  const { publicKey } = useSolanaWallet();

  const deleteCollection = async (collectionId: string, collectionName: string): Promise<DeleteCollectionResult> => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-collection', {
        body: {
          collection_id: collectionId,
          wallet_address: publicKey
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(`Collection "${collectionName}" deleted successfully`);
        return { success: true };
      } else {
        const errorMessage = data?.error || 'Failed to delete collection';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

    } catch (error) {
      console.error('Error deleting collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete collection';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleting,
    deleteCollection
  };
};