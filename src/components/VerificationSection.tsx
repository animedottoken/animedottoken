import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink } from "lucide-react";

interface VerificationSectionProps {
  onReportRisk?: () => void;
}

export function VerificationSection({ onReportRisk }: VerificationSectionProps) {
  return (
    <section className="mt-12 w-full border-y bg-muted/10">
      <div className="container mx-auto max-w-5xl py-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <header className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold leading-tight">Top 3 Verifications</h2>
          <p className="text-sm text-muted-foreground">Independent scanners confirming transparency and safety.</p>
        </header>

        {/* Responsive 3-card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* RugCheck */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>RugCheck</span>
                <a
                  href="https://rugcheck.xyz/tokens/GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open RugCheck report"
                  className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
                >
                  Report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardTitle>
              <CardDescription>Solana-native risk analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Risk Score: <span className="font-medium">1/100 (Good)</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Creator balance: <span className="font-medium">Sold</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Insider networks: <span className="font-medium">None detected</span></span>
              </div>
            </CardContent>
          </Card>

          {/* QuickIntel */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>QuickIntel</span>
                <a
                  href="https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open QuickIntel report"
                  className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
                >
                  Report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardTitle>
              <CardDescription>Token integrity checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Honeypot test: <span className="font-medium">Passed</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>LP locked/burned: <span className="font-medium">Yes</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Can mint / freeze / update fees: <span className="font-medium">No</span></span>
              </div>
            </CardContent>
          </Card>

          {/* GoPlusLabs */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>GoPlusLabs</span>
                <a
                  href="https://gopluslabs.io/token-security/solana/GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open GoPlusLabs report"
                  className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
                >
                  Report <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardTitle>
              <CardDescription>Automated token security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Risky items: <span className="font-medium">0</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Attention items: <span className="font-medium">0</span></span>
              </div>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Transfer Fee: 0% (Non-upgradable)</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Default Tx Restriction: None</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Metadata Not Mutable</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> No Mint / Freeze Functions</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Program Not Closable</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Transferable Token</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Balance Not Mutable</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> No External Hook</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Report a risk CTA */}
        <div className="mt-6 rounded-lg border bg-secondary/10 p-4">
          <p className="text-sm text-muted-foreground">See any risk or suspicious activity? Please let us know.</p>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onReportRisk}
              aria-label="Report a risk"
            >
              Report a risk
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
