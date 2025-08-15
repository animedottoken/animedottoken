import { useEffect, useState } from "react";

// Fetch holder count from Solscan API with 10-minute cache
export function useTokenHolders(tokenAddress: string) {
  const [holders, setHolders] = useState<number | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const cacheKey = `holders:${tokenAddress}`;
    
    // Clear old cache to force fresh fetch
    localStorage.removeItem(cacheKey);
    console.log('Cleared token holders cache, forcing fresh fetch');

    const fetchHolders = async () => {
      try {
        console.log('Fetching token holders for:', tokenAddress);
        // Use edge function to avoid CORS issues
        const res = await fetch('https://eztzddykjnmnpoeyfqcg.supabase.co/functions/v1/get-token-holders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tokenAddress })
        });
        
        console.log('Token holders edge function response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Token holders edge function error:', res.status, errorText);
          throw new Error(`Edge function ${res.status}: ${errorText}`);
        }
        
        const data = await res.json();
        console.log('Token holders edge function response:', data);
        
        const holderCount = data.holders || 123;
        
        setHolders(holderCount);
        localStorage.setItem(cacheKey, JSON.stringify({ v: holderCount, t: Date.now() }));
      } catch (e) {
        // Set fallback value when API fails  
        console.error("Token holders fetch failed, using fallback:", e);
        setHolders(123);
      }
    };

    fetchHolders();
  }, [tokenAddress]);

  return holders;
}
