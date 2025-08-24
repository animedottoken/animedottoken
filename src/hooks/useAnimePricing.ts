import { useState, useEffect } from 'react';
import { ANIME_PAIR_ADDRESS } from '@/constants/token';

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
        
        // Use DexScreener like the main page
        const pairAddress = ANIME_PAIR_ADDRESS;
        
        let animePrice = 0.00004; // Fallback price: ~$0.00004 per ANIME
        
        try {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data?.pairs?.[0]?.priceUsd) {
              animePrice = parseFloat(data.pairs[0].priceUsd);
            }
          }
        } catch (apiError) {
          console.debug('DexScreener API failed, using fallback price:', apiError);
        }
        
        const animeAmount = Math.ceil(usdAmount / animePrice);
        
        setPricingInfo({
          usdPrice: usdAmount,
          animeAmount,
          animePrice,
          loading: false,
          error: null
        });
      } catch (err) {
        // Fallback calculation
        const fallbackAnimeAmount = Math.ceil(usdAmount / 0.00004);
        setPricingInfo({
          usdPrice: usdAmount,
          animeAmount: fallbackAnimeAmount,
          animePrice: 0.00004,
          loading: false,
          error: err instanceof Error ? err.message : 'Using fallback pricing'
        });
      }
    };

    fetchPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    
    return () => clearInterval(interval);
  }, [usdAmount]);

  return pricingInfo;
};