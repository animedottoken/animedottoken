import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

const Reports = () => {
  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}/reports` : "/reports";
  const quickIntelUrl = `https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=${CONTRACT}`;
  const rugCheckUrl = `https://rugcheck.xyz/tokens/${CONTRACT}`;
  const goPlusUrl = `https://gopluslabs.io/token-security/solana/${CONTRACT}`;

  return (
    <main className="container min-h-screen py-12 md:py-20">
      <Helmet>
        <title>ANIME Token Security Reports</title>
        <meta name="description" content="View all ANIME token security reports in one place: QuickIntel, RugCheck, and GoPlus." />
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ANIME Token Security Reports</h1>
        <p className="mt-3 text-muted-foreground">Independent analyses confirming contract safety and transparency.</p>
      </header>

      <section className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>QuickIntel</CardTitle>
            <CardDescription>Honeypot tests, LP lock/burn, function safety</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="link" className="px-0">
              <a href={quickIntelUrl} target="_blank" rel="noreferrer noopener" aria-label="Open QuickIntel report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RugCheck</CardTitle>
            <CardDescription>Solana-native risk scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="link" className="px-0">
              <a href={rugCheckUrl} target="_blank" rel="noreferrer noopener" aria-label="Open RugCheck report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>GoPlus Labs</CardTitle>
            <CardDescription>Automated token security checklist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="link" className="px-0">
              <a href={goPlusUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GoPlus Labs report">
                Open report <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="mx-auto mt-10 max-w-3xl text-center">
        <Button asChild variant="secondary">
          <a href="/" aria-label="Back to home">Back to Home</a>
        </Button>
      </div>
    </main>
  );
};

export default Reports;
