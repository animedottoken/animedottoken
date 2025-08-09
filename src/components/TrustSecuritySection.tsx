import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
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

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">🔎</span>
              Audited & Verified
            </CardTitle>
            <CardDescription>Independently audited by three top community safety tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            {/* QuickIntel */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-muted-foreground"><span className="font-semibold">QuickIntel</span>: Honeypot tests passed; LP lock/burn verified; no malicious transfer traps detected.</p>
                <Button asChild variant="link" className="px-0">
                  <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report">
                    View report <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report" className="shrink-0 rounded-md border border-border bg-card/50 p-1">
                <img src="/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png" alt="QuickIntel security audit for ANIME token" loading="lazy" className="h-8 w-auto object-contain brightness-110 contrast-125" />
              </a>
            </div>
            {/* RugCheck */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-muted-foreground"><span className="font-semibold">RugCheck</span>: Good risk score; creator balance sold; no insider networks detected.</p>
                <Button asChild variant="link" className="px-0">
                  <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report">
                    View report <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
              <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report" className="shrink-0 rounded-md border border-border bg-card/50 p-1">
                <img src="/lovable-uploads/ea27ee81-21f8-4604-823c-5c7cf1789d5b.png" alt="RugCheck risk report for ANIME token" loading="lazy" className="h-8 w-auto object-contain brightness-110 contrast-125" />
              </a>
            </div>
            {/* GoPlus Labs */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-muted-foreground"><span className="font-semibold">GoPlus</span>: 0 risky items; 0 attention items; non-upgradable fees; no mint/freeze functions.</p>
                <Button asChild variant="link" className="px-0">
                  <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report">
                    View report <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
              <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report" className="shrink-0 rounded-md border border-border bg-card/50 p-1">
                <img src="/lovable-uploads/a00a3967-7e07-4a74-860b-d830d228a334.png" alt="GoPlus Labs token security report for ANIME token" loading="lazy" className="h-8 w-auto object-contain brightness-110 contrast-125" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Block 4: Contract Security */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span aria-hidden className="text-2xl">✅</span>
              Safe Contract Functions
            </CardTitle>
            <CardDescription>
              No dangerous functions: cannot mint new tokens, freeze trading, or introduce new transaction taxes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button asChild variant="link" className="px-0">
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open contract function analysis on QuickIntel">
                View analysis <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Community risk reporting CTA */}
      <div className="mx-auto mt-6 max-w-5xl rounded-lg border bg-secondary/10 p-4">
        <p className="text-sm text-muted-foreground">See any risk or suspicious activity? Please let us know.</p>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.message("Thanks for helping keep the community safe.");
              if (typeof window !== "undefined") {
                window.open("https://t.me/AnimeDotTokenCommunity", "_blank", "noopener,noreferrer");
              }
            }}
            aria-label="Report a risk"
          >
            Report a risk
          </Button>
        </div>
      </div>
    </section>
  );
}
