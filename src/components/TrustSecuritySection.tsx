import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Flame, ShieldCheck, Wallet } from "lucide-react";

interface TrustSecuritySectionProps {
  tokenAddress: string;
  creatorWalletUrl: string;
}

export function TrustSecuritySection({ tokenAddress, creatorWalletUrl }: TrustSecuritySectionProps) {
  const quickIntelUrl = `https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=${tokenAddress}`;
  const rugCheckUrl = `https://rugcheck.xyz/tokens/${tokenAddress}`;
  const goPlusUrl = `https://gopluslabs.io/token-security/solana/${tokenAddress}`;

  return (
    <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">The Highest Standard of Trust & Security</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
          Our commitment to safety is permanent and verifiable on-chain. This isn't just a promise; it's a fact.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 100% Liquidity Burned */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-success" aria-hidden />
              100% Liquidity Burned
            </CardTitle>
            <CardDescription>Provider tokens sent to a dead address — liquidity is permanently locked.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Pooled liquidity cannot be withdrawn by anyone.</span>
            </div>
            <Button asChild variant="link" className="px-0">
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="View LP burn proof on QuickIntel">
                View proof on QuickIntel <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Creator Wallet Emptied */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-success" aria-hidden />
              Creator Wallet Emptied
            </CardTitle>
            <CardDescription>The original creator holds 0 tokens — fully community owned.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Ownership is verifiably decentralized.</span>
            </div>
            <Button asChild variant="link" className="px-0">
              <a href={creatorWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open creator wallet on Solscan">
                View creator wallet on Solscan <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Secure & Audited Contract */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
              Secure & Audited Contract
            </CardTitle>
            <CardDescription>No malicious functions. Honeypot tests passed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Verified by top community safety tools:</span>
            </div>
            <ul className="ml-0 list-none space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> QuickIntel (Honeypot: Passed)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> RugCheck (Risk Score: Good, Creator balance: Sold)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" /> GoPlus Labs (Risky 0, Attention 0)
              </li>
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Button asChild variant="link" className="px-0">
                <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report">
                  QuickIntel report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild variant="link" className="px-0">
                <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report">
                  RugCheck report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild variant="link" className="px-0">
                <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report">
                  GoPlus Labs report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
