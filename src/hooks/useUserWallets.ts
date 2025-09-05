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

      console.log('Raw response data:', data);
      
      // Defensive parsing: if data comes back as string, parse it
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (parseError) {
          console.error('Failed to parse response data:', parseError);
          throw new Error('Invalid response format');
        }
      }
      
      if (parsedData?.success) {
        setWallets(parsedData.wallets || []);
        setSummary(parsedData.summary || { total: 0, primary: 0, secondary: 0, remaining_secondary_slots: 10 });
      } else {
        console.error('Function returned error:', parsedData);
        throw new Error(parsedData?.error || 'Failed to fetch wallets');
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
      // Client-side guardrails: Check if wallet is already linked
      const existingWallet = wallets.find(w => w.wallet_address === walletAddress);
      if (existingWallet) {
        toast.error('This wallet is already linked to your account');
        return false;
      }

      // Prevent attempting to link a second primary wallet
      if (walletType === 'primary' && (summary?.primary ?? 0) > 0) {
        toast.error('You already have a primary wallet linked. Unlink it first or add this as a secondary wallet.');
        return false;
      }

      // Check secondary wallet limit
      if (walletType === 'secondary' && (summary?.secondary ?? 0) >= 10) {
        toast.error('You have reached the maximum limit of 10 secondary wallets');
        return false;
      }

      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      // Always use link-secondary-wallet for both primary and secondary wallets
      const { data, error } = await supabase.functions.invoke('link-secondary-wallet', {
        body: {
          wallet_address: walletAddress,
          signature,
          message,
          wallet_type: walletType
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        
        // Enhanced error parsing to surface specific messages
        let errorMsg = 'Failed to link wallet';
        try {
          // First try to parse the error body for JSON responses
          if (error.message && error.message.includes('{')) {
            const errorData = JSON.parse(error.message);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } else {
            // Try other error properties and contexts
            errorMsg = (error as any)?.context?.body?.error || 
                      (error as any)?.context?.error || 
                      (error as any)?.message || 
                      error.message || 
                      errorMsg;
          }
        } catch (parseError) {
          // If all parsing fails, use the raw error
          errorMsg = error.toString() || errorMsg;
        }
        
        toast.error(errorMsg);
        return false;
      }

      // Check the response data for success/error
      if (data?.success === false) {
        // Extract specific error message from function response
        const errorMsg = data?.error || 'Failed to link wallet';
        toast.error(errorMsg);
        return false;
      }

      if (data?.success) {
        toast.success(`${walletType === 'primary' ? 'Primary' : 'Secondary'} wallet linked successfully!`);
        await fetchWallets(); // Refresh the list
        return true;
      } else {
        const msg = data?.error || 'Failed to link wallet';
        toast.error(msg);
        return false;
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
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('unlink-wallet', {
        body: { wallet_id: walletId },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
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

  const cleanupPrimaryWallets = async (): Promise<boolean> => {
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
      const { data, error } = await supabase.functions.invoke('cleanup-primary-wallets', {
        body: {},
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (error) {
        const serverMsg = (error as any)?.context?.body?.error || (error as any)?.context?.error || (error as any)?.message || 'Failed to cleanup primary wallets';
        toast.error(serverMsg);
        return false;
      }

      if (data?.success) {
        toast.success('Primary wallets cleaned up successfully!');
        await fetchWallets(); // Refresh the list
        return true;
      } else {
        const msg = data?.error || 'Failed to cleanup primary wallets';
        toast.error(msg);
        return false;
      }
    } catch (err) {
      console.error('Error cleaning up primary wallets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup primary wallets';
      toast.error(errorMessage);
      return false;
    }
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
    cleanupPrimaryWallets,
    getPrimaryWallet,
    getSecondaryWallets,
    generateLinkingMessage,
  };
}