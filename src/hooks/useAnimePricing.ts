import { useState, useEffect } from 'react';

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
        
        // Use DexScreener like the main page - using a mock pair address for now
        // Replace with actual ANIME token pair address
        const pairAddress = "ANIME_PAIR_ADDRESS_HERE";
        
        let animePrice = 0.02; // Fallback price: 1 ANIME = 0.02 USDT
        
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
        const fallbackAnimeAmount = Math.ceil(usdAmount / 0.02);
        setPricingInfo({
          usdPrice: usdAmount,
          animeAmount: fallbackAnimeAmount,
          animePrice: 0.02,
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