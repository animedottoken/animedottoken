import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceSettings {
  id: string;
  platform_fee_percentage: number;
  platform_wallet_address: string;
  created_at: string;
  updated_at: string;
}

export const useMarketplaceSettings = () => {
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching marketplace settings:', error);
        // Use default settings if none found
        setSettings({
          id: 'default',
          platform_fee_percentage: 2.5,
          platform_wallet_address: '7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching marketplace settings:', error);
      // Use default settings on error
      setSettings({
        id: 'default',
        platform_fee_percentage: 2.5,
        platform_wallet_address: '7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: fetchSettings,
  };
};