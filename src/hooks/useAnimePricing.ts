import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingInfo {
  usdPrice: number;
  animeAmount: number;
  animePrice: number;
  loading: boolean;
  error: string | null;
}

export const useAnimePricing = (usdAmount: number) => {
  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
    usdPrice: usdAmount,
    animeAmount: 0,
    animePrice: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setPricingInfo(prev => ({ ...prev, loading: true, error: null }));
        
        const { data, error } = await supabase.functions.invoke('get-anime-price');
        
        if (error) throw error;
        
        const animePrice = data.price;
        const animeAmount = usdAmount / animePrice;
        
        setPricingInfo({
          usdPrice: usdAmount,
          animeAmount: Math.ceil(animeAmount), // Round up to avoid underpayment
          animePrice,
          loading: false,
          error: null
        });
      } catch (err) {
        setPricingInfo(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch pricing'
        }));
      }
    };

    fetchPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    
    return () => clearInterval(interval);
  }, [usdAmount]);

  return pricingInfo;
};