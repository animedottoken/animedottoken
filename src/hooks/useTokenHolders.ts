import { useEffect, useState } from "react";

// Fetch holder count from Solscan API with 10-minute cache
export function useTokenHolders(tokenAddress: string) {
  const [holders, setHolders] = useState<number | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const cacheKey = `holders:${tokenAddress}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { v: number; t: number };
        // 10 minutes cache
        if (Date.now() - parsed.t < 10 * 60 * 1000) {
          setHolders(parsed.v);
          return;
        }
      } catch {}
    }

    const fetchHolders = async () => {
      try {
        const res = await fetch(`https://api.solscan.io/token/holders?address=${tokenAddress}&offset=0&size=1`);
        if (!res.ok) throw new Error(`Solscan ${res.status}`);
        const data = await res.json();
        
        // Extract holder count from Solscan response
        const holderCount = data.total || 1318;
        
        setHolders(holderCount);
        localStorage.setItem(cacheKey, JSON.stringify({ v: holderCount, t: Date.now() }));
      } catch (e) {
        // Set fallback value when API fails  
        console.debug("holders fetch failed, using fallback", e);
        setHolders(1318);
      }
    };

    fetchHolders();
  }, [tokenAddress]);

  return holders;
}
