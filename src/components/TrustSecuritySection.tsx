import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SecurityReportsDetails } from "@/components/SecurityReportsDetails";
import { ExternalLink, ChevronDown } from "lucide-react";
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
  const [treasuryDetailsOpen, setTreasuryDetailsOpen] = useState(false);
  const holders = useTokenHolders(tokenAddress);
  return (
    <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
      <header className="mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Fully Audited, Secure, and Transparent</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
          $ANIME smart contract is audited, verified, and has no hidden functions. 100% LP burned. Revival Wallet supports only ecosystem growth. View everything on-chain for full transparency.
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
              All liquidity pool tokens are burned forever. Liquidity cannot be withdrawn. $ANIME trading is always safe and permanent.
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
              Creator wallet holds zero $ANIME. Project is fully community-owned and verifiable on-chain.
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
                <Button variant="link" className="px-0">{detailsOpen ? "Hide details" : "Show details"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} /></Button>
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
              A Treasury for the Revival
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-3 text-muted-foreground">
              <p>
                To fuel the community-led revival and ensure long-term growth, the official ANIME Revival & Ecosystem Fund has been established. This is not a private team wallet; it is a <span className="font-semibold text-foreground">publicly viewable treasury</span> dedicated to the project's success.
              </p>
              
              <Collapsible open={treasuryDetailsOpen} onOpenChange={setTreasuryDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="px-0">
                    {treasuryDetailsOpen ? "Hide details" : "Show details"} 
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${treasuryDetailsOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-3">
                    <p>
                      It holds <span className="font-semibold text-foreground">11.18% (109,000,000 $ANIME)</span> of the current token supply. These funds are the project's "war chest" and will be used exclusively for strategic growth, including marketing, exchange listings, and future development.
                    </p>
                    <p className="font-medium text-foreground">
                      Our Commitment: No tokens from this wallet will be sold on the open market. All major transactions from this fund will be communicated transparently to the community beforehand.
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-mono bg-background p-2 rounded border">
                        <span className="text-muted-foreground break-all">7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText('7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8')}
                          aria-label="Copy wallet address to clipboard"
                        >
                          Copy Address
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="hero">
                <a href={revivalWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open the community revival treasury wallet on Solscan">
                  View Ecosystem Fund on Solscan
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
