import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DexScreenerChartProps {
  pairAddress?: string;
}

export function MarketCapChart({ pairAddress = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc" }: DexScreenerChartProps) {
  // DEXScreener embed URL with proper parameters and purple chart line
  const dexScreenerEmbedUrl = `https://dexscreener.com/solana/${pairAddress}?embed=1&loadChartSettings=0&trades=0&tabs=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=2&chartType=usd&interval=1D&lineColor=%23a855f7`;

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          $ANIME Live Daily Price Chart
          <Badge variant="outline">Real-time</Badge>
        </CardTitle>
        <CardDescription>
          Live daily price data from DEXScreener
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <style dangerouslySetInnerHTML={{
          __html: `
            #dexscreener-embed {
              position: relative;
              width: 100%;
              padding-bottom: 100%;
            }
            @media (min-width: 768px) {
              #dexscreener-embed {
                padding-bottom: 75%;
              }
            }
            @media (min-width: 1024px) {
              #dexscreener-embed {
                padding-bottom: 65%;
              }
            }
            @media (min-width: 1400px) {
              #dexscreener-embed {
                padding-bottom: 55%;
              }
            }
            #dexscreener-embed iframe {
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              border: 0;
            }
          `
        }} />
        <div id="dexscreener-embed">
          <iframe 
            src={dexScreenerEmbedUrl}
            title="ANIME Token Price Chart"
            allow="fullscreen"
            loading="lazy"
          />
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Live data provided by{" "}
          <a 
            href={`https://dexscreener.com/solana/${pairAddress}`}
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