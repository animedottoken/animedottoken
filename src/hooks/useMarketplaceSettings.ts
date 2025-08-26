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
      // First try authenticated view for full settings
      const { data: authData, error: authError } = await supabase.rpc('get_marketplace_settings_authenticated');

      if (!authError && authData && authData.length > 0) {
        const row = authData[0] as any;
        setSettings({
          id: row.id,
          platform_fee_percentage: Number(row.platform_fee_percentage),
          platform_wallet_address: row.platform_wallet_address,
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
        return;
      }

      // Fallback for anonymous users: public, masked info
      const { data: publicInfo, error: publicError } = await supabase.rpc('get_marketplace_info_public');

      if (!publicError && publicInfo && publicInfo.length > 0) {
        const row = publicInfo[0] as any;
        setSettings({
          id: 'public',
          platform_fee_percentage: Number(row.platform_fee_percentage),
          // Hide wallet address publicly for security
          platform_wallet_address: 'hidden',
          created_at: new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        });
        return;
      }

      // Final fallback to defaults
      setSettings({
        id: 'default',
        platform_fee_percentage: 2.5,
        platform_wallet_address: 'hidden',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching marketplace settings:', error);
      // Use default settings on error
      setSettings({
        id: 'default',
        platform_fee_percentage: 2.5,
        platform_wallet_address: 'hidden',
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