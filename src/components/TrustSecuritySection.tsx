import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface TrustSecuritySectionProps {
  tokenAddress: string;
  creatorWalletUrl: string;
}

export function TrustSecuritySection({ tokenAddress, creatorWalletUrl }: TrustSecuritySectionProps) {
  const quickIntelUrl = `https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=${tokenAddress}`;
  const rugCheckUrl = `https://rugcheck.xyz/tokens/${tokenAddress}`;
  const goPlusUrl = `https://gopluslabs.io/token-security/solana/${tokenAddress}`;
  const revivalWalletAddress = "7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8";
  const revivalWalletUrl = `https://solscan.io/account/${revivalWalletAddress}`;

  return (
    <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">The Highest Standard of Trust & Security</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
          Our commitment to safety is permanent and verifiable on-chain. This isn't just a promise; it's a fact.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Block 1: Liquidity Status */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🔥</span>
              100% LP Burned
            </CardTitle>
            <CardDescription>
              The provider tokens for the liquidity pool were sent to a dead address. This makes liquidity withdrawal impossible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button asChild variant="link" className="px-0">
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="View LP burn proof on QuickIntel">
                View proof <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Block 2: Creator's Stake */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🛡️</span>
              Creator Holds 0 Tokens
            </CardTitle>
            <CardDescription>
              The original creator's wallet holds a functional zero balance of $ANIME tokens — fully community owned.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button asChild variant="link" className="px-0">
              <a href={creatorWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open creator wallet on Solscan">
                View creator wallet <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Combined: Audits & Contract Safety */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🔎</span>
              Fully Audited & Secure
            </CardTitle>
            <CardDescription>
              Our contract is verified and permanently secured. Independent audits have confirmed:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Honeypot tests passed.</li>
              <li>LP lock/burn is verified.</li>
              <li>No malicious functions: The contract cannot mint new tokens, freeze trading, or change taxes.</li>
            </ul>
            <div>
              <Button asChild variant="link" className="px-0">
                <a href="/reports" aria-label="View all audit and security reports">
                  View All Reports <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New: Community-Led Revival */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🌱</span>
              Community-Led Revival
            </CardTitle>
            <CardDescription>
              The ANIME project has been revived by its community. As a public commitment to long-term growth, we’ve established a transparent treasury wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              These funds are dedicated to building the ecosystem and supporting community initiatives — not for selling.
            </p>
            <Button asChild variant="link" className="px-0">
              <a href={revivalWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open the community revival treasury wallet on Solscan">
                View the Revival Wallet <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

    </section>
  );
}
