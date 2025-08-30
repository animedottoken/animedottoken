import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserWallet {
  id: string;
  wallet_address: string;
  wallet_type: 'primary' | 'secondary';
  is_verified: boolean;
  linked_at: string;
}

export interface WalletSummary {
  total: number;
  primary: number;
  secondary: number;
  remaining_secondary_slots: number;
}

export function useUserWallets() {
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [summary, setSummary] = useState<WalletSummary>({
    total: 0,
    primary: 0,
    secondary: 0,
    remaining_secondary_slots: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWallets = async () => {
    if (!user) {
      setWallets([]);
      setSummary({ total: 0, primary: 0, secondary: 0, remaining_secondary_slots: 10 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('get-user-wallets', {
        body: {},
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (fetchError) {
        console.error('Supabase function invoke error:', fetchError);
        throw new Error(`Failed to invoke function: ${fetchError.message}`);
      }

      if (data?.success) {
        setWallets(data.wallets || []);
        setSummary(data.summary || { total: 0, primary: 0, secondary: 0, remaining_secondary_slots: 10 });
      } else {
        throw new Error(data?.error || 'Failed to fetch wallets');
      }
    } catch (err) {
      console.error('Error fetching user wallets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setError(`Error loading wallets: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const linkWallet = async (
    walletAddress: string, 
    signature: string, 
    message: string, 
    walletType: 'primary' | 'secondary' = 'secondary'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('link-secondary-wallet', {
        body: {
          wallet_address: walletAddress,
          signature,
          message,
          wallet_type: walletType
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${walletType === 'primary' ? 'Primary' : 'Secondary'} wallet linked successfully!`);
        await fetchWallets(); // Refresh the list
        return true;
      } else {
        throw new Error(data?.error || 'Failed to link wallet');
      }
    } catch (err) {
      console.error('Error linking wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to link wallet';
      toast.error(errorMessage);
      return false;
    }
  };

  const unlinkWallet = async (walletId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('unlink-wallet', {
        body: { wallet_id: walletId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Wallet unlinked successfully!');
        await fetchWallets(); // Refresh the list
        return true;
      } else {
        throw new Error(data?.error || 'Failed to unlink wallet');
      }
    } catch (err) {
      console.error('Error unlinking wallet:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlink wallet';
      toast.error(errorMessage);
      return false;
    }
  };

  const getPrimaryWallet = (): UserWallet | null => {
    return wallets.find(w => w.wallet_type === 'primary') || null;
  };

  const getSecondaryWallets = (): UserWallet[] => {
    return wallets.filter(w => w.wallet_type === 'secondary');
  };

  const generateLinkingMessage = (walletAddress: string): string => {
    const timestamp = Date.now();
    return `I am linking this wallet ${walletAddress} to my ANIME.TOKEN account.\n\nTimestamp: ${timestamp}`;
  };

  useEffect(() => {
    fetchWallets();
  }, [user]);

  return {
    wallets,
    summary,
    loading,
    error,
    fetchWallets,
    linkWallet,
    unlinkWallet,
    getPrimaryWallet,
    getSecondaryWallets,
    generateLinkingMessage
  };
}