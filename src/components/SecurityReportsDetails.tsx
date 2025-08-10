import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SecurityReportsDetailsProps {
  tokenAddress: string;
}

export function SecurityReportsDetails({ tokenAddress }: SecurityReportsDetailsProps) {
  const quickIntelUrl = `https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=${tokenAddress}`;
  const rugCheckUrl = `https://rugcheck.xyz/tokens/${tokenAddress}`;
  const goPlusUrl = `https://gopluslabs.io/token-security/solana/${tokenAddress}`;

  return (
    <section className="space-y-5">
      <header>
        <h3 className="text-xl md:text-2xl font-bold leading-tight">ANIME Token Security Reports</h3>
        <p className="text-sm text-muted-foreground">Independent analyses confirming contract safety and transparency.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* QuickIntel */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>QuickIntel</CardTitle>
            <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report" className="mt-2 inline-block w-fit rounded-md border border-border bg-card/50 p-1">
              <img src="/lovable-uploads/4635f823-47d8-4ddb-a3f7-12870888c162.png" alt="QuickIntel security audit for ANIME token" loading="lazy" className="h-7 w-auto object-contain brightness-110 contrast-125" />
            </a>
            <CardDescription>Honeypot tests, LP lock/burn, function safety</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Honeypot tests passed.</li>
              <li>LP lock/burn verified.</li>
              <li>No malicious transfer traps detected.</li>
            </ul>
            <Button asChild variant="link" className="px-0">
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* RugCheck */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>RugCheck</CardTitle>
            <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report" className="mt-2 inline-block w-fit rounded-md border border-border bg-card/50 p-1">
              <img src="/lovable-uploads/ea27ee81-21f8-4604-823c-5c7cf1789d5b.png" alt="RugCheck risk report for ANIME token" loading="lazy" className="h-7 w-auto object-contain brightness-110 contrast-125" />
            </a>
            <CardDescription>Solana-native risk scoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Good risk score.</li>
              <li>Creator balance sold.</li>
              <li>No insider networks detected.</li>
            </ul>
            <Button asChild variant="link" className="px-0">
              <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* GoPlus Labs */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>GoPlus Labs</CardTitle>
            <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report" className="mt-2 inline-block w-fit rounded-md border border-border bg-card/50 p-1">
              <img src="/lovable-uploads/a00a3967-7e07-4a74-860b-d830d228a334.png" alt="GoPlus Labs token security report for ANIME token" loading="lazy" className="h-7 w-auto object-contain brightness-110 contrast-125" />
            </a>
            <CardDescription>Automated token security checklist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>0 risky items; 0 attention items.</li>
              <li>Non-upgradable fees; no mint/freeze functions.</li>
              <li>Metadata not mutable; program not closable.</li>
            </ul>
            <Button asChild variant="link" className="px-0">
              <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
