import { useEffect, useState } from "react";

// Fetch holder count from RugCheck public API with 10-minute cache
export function useTokenHolders(mint: string) {
  const [holders, setHolders] = useState<number | null>(null);

  useEffect(() => {
    if (!mint) return;

    const cacheKey = `holders:${mint}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { v: number; t: number };
        // 10 minutes cache
        if (Date.now() - parsed.t < 10 * 60 * 1000) {
          setHolders(parsed.v);
        }
      } catch {}
    }

    const fetchHolders = async () => {
      try {
        const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}`);
        if (!res.ok) throw new Error(`RugCheck ${res.status}`);
        const data = await res.json();
        // Try a few likely keys to be robust to API shape
        const candidates = [
          data?.holders,
          data?.holder_count,
          data?.summary?.holderCount,
          data?.summary?.holders,
          data?.token?.holders,
        ].filter((v: any) => typeof v === "number" && v >= 0);
        if (candidates.length) {
          const value = candidates[0] as number;
          setHolders(value);
          localStorage.setItem(cacheKey, JSON.stringify({ v: value, t: Date.now() }));
        }
      } catch (e) {
        // Silently ignore; UI will show fallback
        console.debug("holders fetch failed", e);
      }
    };

    fetchHolders();
  }, [mint]);

  return holders;
}
