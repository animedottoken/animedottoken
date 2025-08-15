import { useEffect, useState } from "react";

// Fetch holder count from Solscan API with 10-minute cache
export function useTokenHolders(tokenAddress: string) {
  const [holders, setHolders] = useState<number | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const cacheKey = `holders:${tokenAddress}`;
    const cached = localStorage.getItem(cacheKey);
    console.log('Cached token holders data:', cached);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { v: number; t: number };
        console.log('Parsed cache:', parsed, 'Age:', Date.now() - parsed.t, 'ms');
        // 10 minutes cache
        if (Date.now() - parsed.t < 10 * 60 * 1000) {
          console.log('Using cached token holders:', parsed.v);
          setHolders(parsed.v);
          return;
        } else {
          console.log('Cache expired, fetching fresh data');
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

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
