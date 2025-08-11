import { useEffect, useState } from "react";

interface TokenData {
  price: number;
  marketCap: number;
}

export function useLivePrice(pairAddress: string) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairAddress) return;

    const fetchTokenData = async () => {
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`);
        if (!res.ok) throw new Error(`DexScreener API ${res.status}`);
        const data = await res.json();
        
        if (data?.pairs?.[0]) {
          const pair = data.pairs[0];
          setTokenData({
            price: parseFloat(pair.priceUsd || 0),
            marketCap: parseFloat(pair.marketCap || 0)
          });
        }
      } catch (e) {
        console.debug("Price fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTokenData, 30000);
    
    return () => clearInterval(interval);
  }, [pairAddress]);

  return { tokenData, loading };
}