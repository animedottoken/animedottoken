import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SecurityReportsDetails } from "@/components/SecurityReportsDetails";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTokenHolders } from "@/hooks/useTokenHolders";

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
  const holdersUrl = `https://solscan.io/token/${tokenAddress}#holders`;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const holders = useTokenHolders(tokenAddress);
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
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="link" className="px-0">{detailsOpen ? "Hide details" : "Show details"}</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4">
                  <SecurityReportsDetails tokenAddress={tokenAddress} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* New: Community-Led Revival */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🌱</span>
              Community-Led Revival
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              The ANIME project has been revived by its strong and growing community of over <span className="font-semibold text-foreground">{holders ? holders.toLocaleString() : "1,300+"}</span> holders. To honor this trust and commit to long-term growth, we have established the official Revival Wallet, which is publicly viewable by everyone. These funds are dedicated to building the ecosystem and supporting our community, not for selling.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="hero">
                <a href={revivalWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open the community revival treasury wallet on Solscan">
                  View the Revival Wallet
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={holdersUrl} target="_blank" rel="noreferrer noopener" aria-label="View all holders on Solscan">
                  See All Holders on Solscan
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </section>
  );
}
