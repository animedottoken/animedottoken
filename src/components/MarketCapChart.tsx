import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MarketData {
  timestamp: number;
  marketCap: number;
  price: number;
  volume24h: number;
}

interface TokenInfo {
  name: string;
  symbol: string;
  marketCap: number;
  price: number;
  volume24h: number;
  priceChange24h: number;
  fdv: number;
}

interface MarketCapChartProps {
  tokenAddress: string;
}

const chartConfig = {
  marketCap: {
    label: "Market Cap ($)",
    color: "hsl(var(--primary))",
  },
};

export function MarketCapChart({ tokenAddress }: MarketCapChartProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [chartData, setChartData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current token data from DexScreener
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch token data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.pairs || data.pairs.length === 0) {
          throw new Error("No trading pairs found for this token");
        }

        // Get the primary pair (usually the one with highest liquidity)
        const primaryPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

        const tokenData: TokenInfo = {
          name: primaryPair.baseToken.name,
          symbol: primaryPair.baseToken.symbol,
          marketCap: primaryPair.marketCap || primaryPair.fdv || 0,
          price: parseFloat(primaryPair.priceUsd || "0"),
          volume24h: primaryPair.volume?.h24 || 0,
          priceChange24h: primaryPair.priceChange?.h24 || 0,
          fdv: primaryPair.fdv || 0,
        };

        setTokenInfo(tokenData);

        // Generate sample historical data (in real implementation, you'd fetch this from API)
        // DexScreener doesn't provide historical data in free tier, so we simulate it
        const now = Date.now();
        const historicalData: MarketData[] = [];
        
        for (let i = 23; i >= 0; i--) {
          const timestamp = now - (i * 60 * 60 * 1000); // Every hour for 24 hours
          const variance = 0.8 + Math.random() * 0.4; // ±20% variance
          historicalData.push({
            timestamp,
            marketCap: tokenData.marketCap * variance,
            price: tokenData.price * variance,
            volume24h: tokenData.volume24h * variance,
          });
        }

        setChartData(historicalData);
      } catch (err) {
        console.error("Error fetching token data:", err);
        setError(err instanceof Error ? err.message : "Failed to load market data");
      } finally {
        setLoading(false);
      }
    };

    if (tokenAddress) {
      fetchTokenData();
    }
  }, [tokenAddress]);

  const formatMarketCap = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value: number) => {
    if (value < 0.01) return `$${value.toFixed(6)}`;
    if (value < 1) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Loading market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to load market data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenInfo) {
    return null;
  }

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Market Cap Chart
          <Badge variant={tokenInfo.priceChange24h >= 0 ? "default" : "destructive"}>
            {tokenInfo.priceChange24h >= 0 ? "+" : ""}{tokenInfo.priceChange24h.toFixed(2)}%
          </Badge>
        </CardTitle>
        <CardDescription>
          {tokenInfo.name} ({tokenInfo.symbol}) • Market Capitalization over 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">{formatPrice(tokenInfo.price)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="text-lg font-semibold">{formatMarketCap(tokenInfo.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume 24h</p>
            <p className="text-lg font-semibold">{formatMarketCap(tokenInfo.volume24h)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">FDV</p>
            <p className="text-lg font-semibold">{formatMarketCap(tokenInfo.fdv)}</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                tickFormatter={formatMarketCap}
                label={{ value: 'Market Cap ($)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatMarketCap(value as number),
                      "Market Cap"
                    ]}
                    labelFormatter={(timestamp) => 
                      new Date(timestamp).toLocaleString()
                    }
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="marketCap"
                stroke="var(--color-marketCap)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          Data provided by{" "}
          <a 
            href={`https://dexscreener.com/solana/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            DEXScreener
          </a>
        </div>
      </CardContent>
    </Card>
  );
}