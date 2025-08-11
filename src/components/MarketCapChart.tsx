import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DexScreenerChartProps {
  tokenAddress: string;
}

export function MarketCapChart({ tokenAddress }: DexScreenerChartProps) {
  // DEXScreener embed URL for the token
  const dexScreenerEmbedUrl = `https://dexscreener.com/solana/${tokenAddress}?embed=1&theme=dark&trades=0&info=0`;

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Live Price Chart
          <Badge variant="outline">Real-time</Badge>
        </CardTitle>
        <CardDescription>
          Live price data from DEXScreener
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[32rem] rounded-lg overflow-hidden">
          <iframe
            src={dexScreenerEmbedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title="DEXScreener Price Chart"
            className="w-full h-full"
          />
        </div>
        <div className="p-4 text-xs text-muted-foreground text-center">
          Live data provided by{" "}
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