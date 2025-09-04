import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NewsletterStatus {
  email: string;
  status: 'not_subscribed' | 'pending' | 'confirmed' | 'unsubscribed';
  subscribedAt?: string;
  unsubscribedAt?: string;
  isSubscribed: boolean;
}

export function useNewsletterStatus() {
  const [status, setStatus] = useState<NewsletterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStatus = async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('newsletter-status');
      
      if (fetchError) {
        throw fetchError;
      }

      setStatus(data);
    } catch (err) {
      console.error('Error fetching newsletter status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletter status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      const { data, error: unsubError } = await supabase.functions.invoke('newsletter-unsubscribe-auth', {
        method: 'POST'
      });
      
      if (unsubError) {
        throw unsubError;
      }

      // Refresh status after unsubscribing
      await fetchStatus();
      return data;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      throw err instanceof Error ? err : new Error('Failed to unsubscribe');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  return {
    status,
    loading,
    error,
    unsubscribe,
    refetch: fetchStatus
  };
}