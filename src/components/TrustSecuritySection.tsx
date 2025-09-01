import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SecurityReportsDetails } from "@/components/SecurityReportsDetails";
import { ExternalLink, ChevronDown, Copy, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { toast } from "sonner";
import { useViewMode } from "@/contexts/ViewModeContext";

interface TrustSecuritySectionProps {
  tokenAddress: string;
  creatorWalletUrl: string;
}

export function TrustSecuritySection({ tokenAddress, creatorWalletUrl }: TrustSecuritySectionProps) {
  const { viewMode } = useViewMode();
  const isOverview = viewMode === 'overview';
  const quickIntelUrl = `https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=${tokenAddress}`;
  const rugCheckUrl = `https://rugcheck.xyz/tokens/${tokenAddress}`;
  const goPlusUrl = `https://gopluslabs.io/token-security/solana/${tokenAddress}`;
  const revivalWalletAddress = "7zi8Vhb7BNSVWHJSQBJHLs4DtDk7fE4XzULuUyyfuwL8";
  const revivalWalletUrl = `https://solscan.io/account/${revivalWalletAddress}#portfolio`;
  const holdersUrl = `https://solscan.io/token/${tokenAddress}#holders`;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [treasuryDetailsOpen, setTreasuryDetailsOpen] = useState(false);
  const holders = useTokenHolders(tokenAddress);

  // Set default open state based on view mode
  useEffect(() => {
    setDetailsOpen(viewMode !== 'overview');
    setTreasuryDetailsOpen(viewMode === 'full');
  }, [viewMode]);

  return (
    <section className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
      <div className={`mb-12 ${isOverview ? 'text-left' : 'text-center'}`}>
        <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isOverview ? 'flex items-center' : 'flex items-center justify-center'} gap-3`}>
          <Shield className="w-10 h-10 text-violet-400" />
          Built on a Foundation of Trust & Transparency
        </h2>
        <p className={`text-lg text-muted-foreground ${isOverview ? '' : 'max-w-3xl mx-auto'}`}>
          $ANIME leverages the publicly audited, battle-tested Metaplex protocol used by thousands of Solana projects. 100% LP burned, creator holds zero tokens. Everything is verifiable on-chain through radical transparency.
        </p>
        
        {isOverview && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-4 group font-medium">
              <span>{detailsOpen ? "Hide details" : "Show details"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-8">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

                  {/* Combined: Protocol Security */}
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <span aria-hidden className="text-2xl">🔎</span>
                        Metaplex Protocol Security
                      </CardTitle>
                      <CardDescription>
                        Built on the public, battle-tested Metaplex Auction House protocol. No custom contract risks.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        <li>Uses proven Metaplex protocol trusted by thousands of projects</li>
                        <li>LP burn verified and permanent</li>
                        <li>Standard SPL token with no hidden functions or backdoors</li>
                      </ul>
                      <Button asChild variant="link" className="px-0 w-fit">
                        <a href="/trust" className="text-primary hover:text-primary/80">
                          View detailed security reports & treasury information →
                        </a>
                      </Button>
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      To fuel the community-led revival and ensure long-term growth, this wallet functions as the official ANIME.TOKEN Revival & Ecosystem Fund. It operates as a publicly viewable treasury—separate from any private founder wallets—and is dedicated to the project's success with a commitment to radical transparency.
                    </p>
                    <Button asChild variant="link" className="px-0 w-fit mt-3">
                      <a href="/trust" className="text-primary hover:text-primary/80">
                        View detailed treasury information & security reports →
                      </a>
                    </Button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="hero">
                          <a href={revivalWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open the community revival treasury wallet on Solscan">
                            View Ecosystem Fund <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                        <Button asChild variant="outline">
                          <a href={holdersUrl} target="_blank" rel="noreferrer noopener" aria-label="View all holders on Solscan">
                            See All Holders <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {!isOverview && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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

          {/* Combined: Protocol Security */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span aria-hidden className="text-2xl">🔎</span>
                Metaplex Protocol Security
              </CardTitle>
              <CardDescription>
                Built on the public, battle-tested Metaplex Auction House protocol. No custom contract risks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Uses proven Metaplex protocol trusted by thousands of projects</li>
                <li>LP burn verified and permanent</li>
                <li>Standard SPL token with no hidden functions or backdoors</li>
              </ul>
                      <Button asChild variant="link" className="px-0 w-fit">
                        <a href="/trust" className="text-primary hover:text-primary/80">
                          View detailed security reports & treasury information →
                        </a>
                      </Button>
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
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To fuel the community-led revival and ensure long-term growth, this wallet functions as the official ANIME.TOKEN Revival & Ecosystem Fund. It operates as a publicly viewable treasury—separate from any private founder wallets—and is dedicated to the project's success with a commitment to radical transparency.
                </p>
                <Button asChild variant="link" className="px-0 w-fit mt-3">
                  <a href="/trust" className="text-primary hover:text-primary/80">
                    View detailed treasury information & security reports →
                  </a>
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild variant="hero">
                  <a href={revivalWalletUrl} target="_blank" rel="noreferrer noopener" aria-label="Open the community revival treasury wallet on Solscan">
                    View Ecosystem Fund <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={holdersUrl} target="_blank" rel="noreferrer noopener" aria-label="View all holders on Solscan">
                    See All Holders <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prominent CTA Button */}
      <div className="text-center mt-8">
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold shadow-elevated hover:shadow-glow transition-all duration-300">
          <a href="/trust">
            View Full Security Report & Technical Details
          </a>
        </Button>
      </div>
    </section>
  );
}