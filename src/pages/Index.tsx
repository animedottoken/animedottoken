import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

const Index = () => {
  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT);
    toast.success("Contract address copied");
  };

  const handleReportRisk = () => {
    const user = 'AnimeDotToken';
    const domain = 'gmail.com';
    const to = `${user}@${domain}`;
    const subject = 'Risk self-reported';
    const body = 'Please describe what you found and include links or screenshots.';
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      window.location.href = mailto;
    } finally {
      navigator.clipboard?.writeText(to).catch(() => {});
      toast.message("If your email app didn't open, we copied the address.");
    }
  };

  return (
    <main className="min-h-screen py-12 md:py-20 container">
      <Helmet>
        <title>ANIME Token | Official Community on Solana</title>
        <meta name="description" content="Official home of $ANIME on Solana. Community-driven vision, trust & verification, how to buy, and links to Telegram, X, Discord, and TikTok." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/'} />
        <meta property="og:title" content="ANIME Token | Official Community" />
        <meta property="og:description" content="$ANIME is a truly community-driven project on Solana." />
        <meta property="og:type" content="website" />
      </Helmet>

      <header className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card shadow-glow">
        <img
          src="/lovable-uploads/e202e323-277e-437a-b379-3b52b950a11d.png"
          alt="ANIME Token banner with anime characters and logo"
          loading="eager"
          className="h-[360px] w-full object-cover md:h-[520px]"
        />
      </header>
      <div className="mx-auto max-w-5xl px-6 mt-6 md:mt-8">
        <div className="max-w-3xl animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" alt="ANIME Token hexagon logo" className="h-10 w-10 md:h-12 md:w-12" loading="eager" />
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Beyond a Token. A New Era for Anime.
            </h1>
          </div>
          <p className="mt-3 md:mt-4 text-muted-foreground md:text-lg">
            Welcome to the official home of $ANIME, a truly community-driven project on Solana dedicated to building the #1 global hub for anime culture.
          </p>
          <div className="mt-5 md:mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero">
              <a href="https://dexscreener.com/solana/h5eyz1skumdwrddhucfnvsps1ns3lhf7wdtqmfdt8zwc?maker=HHW5T7c8sXZ25J9GDXaA81aJ1DQZ15NgWACbeBzxBzKJ" target="_blank" rel="noreferrer noopener">Buy $ANIME on DEX Screener</a>
            </Button>
            <Button asChild variant="glass">
              <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener">Follow us on X (Twitter)</a>
            </Button>
          </div>
        </div>
      </div>

      <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>From a Powerful Idea to a Community Movement</CardTitle>
            <CardDescription>
              The $ANIME token was born from a powerful vision: A New Internet Money Era. It laid the foundation for a project with massive potential.
              Today, the community is stepping up to carry that torch forward. With the original creator having fully divested their holdings, the project is now verifiably and completely in the hands of its community.
              Our mission is to build a decentralized, self-sustaining ecosystem where fans can connect, creators can thrive, and everyone can share their passion for anime.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Trust & Verification - Dedicated horizontal section */}
      <section className="mt-12 w-full border-y bg-muted/10">
        <div className="container mx-auto max-w-5xl py-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>A Project You Can Trust. Verifiably.</CardTitle>
              <CardDescription>Transparency and security are the foundations of our community. Below is a quick, human-readable audit summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Independently audited: move key scanners to the top */}
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="https://rugcheck.xyz/tokens/GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump" target="_blank" rel="noreferrer noopener">RugCheck: Good (1/100)</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump" target="_blank" rel="noreferrer noopener">QuickIntel: Low Risk</a>
                </Button>
              </div>

              <div className="space-y-5 text-left">
                {/* Liquidity & Burn */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight border-l-2 border-primary/40 pl-3">Liquidity &amp; Burn</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Total Locked Liquidity:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">100%</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Burned:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">100%</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* DexScreener Audit */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight border-l-2 border-primary/40 pl-3">DexScreener Audit (Mintable &amp; Freezable)</h3>
                  <p className="mt-2 text-sm flex flex-wrap items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No issues</span>
                    <span className="mx-1">•</span>
                    <span>
                      Mintable:
                      <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                    </span>
                    <span className="mx-1">•</span>
                    <span>
                      Freezable:
                      <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                    </span>
                    <a className="ml-2 underline underline-offset-4" href="https://dexscreener.com/solana/h5eyz1skumdwrddhucfnvsps1ns3lhf7wdtqmfdt8zwc" target="_blank" rel="noreferrer noopener">View</a>
                  </p>
                </div>

                {/* QuickIntel Verification */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight border-l-2 border-primary/40 pl-3">QuickIntel Verification</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Honeypot Test:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">Passed</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Has LP Locked or Burned:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">Yes</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Verified:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">Yes</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Has Delegated Token Ownership:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Can Mint:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Can Freeze Trading:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Can Update Fees/Taxes:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Is Data Changeable:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">No</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* RugCheck Overview */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight border-l-2 border-primary/40 pl-3">RugCheck Overview</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Risk Analysis:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">1/100 Good</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        <span className="font-semibold">Supply:</span>
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">974 M</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Creator Balance:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">SOLD</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Holders:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">{"> 100,000 holders"}</span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>
                        Insider Networks:
                        <span className="ml-1 inline-flex items-center rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-success">None detected</span>
                      </span>
                    </li>
                  </ul>

                  {/* Community Treasury */}
                  <div className="pt-2">
                    <p>
                      <span className="font-semibold">Community Treasury (Largest Holder):</span>
                      {" "}Address <code className="rounded-md bg-secondary px-1.5 py-0.5 text-xs">HHW5T7c8sXZ25J9GDXaA81aJ1DQZ15NgWACbeBzxBzKJ</code>.
                      {" "}View on <a href="https://solscan.io/account/HHW5T7c8sXZ25J9GDXaA81aJ1DQZ15NgWACbeBzxBzKJ" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Solscan</a>.
                      {" "}We are here to HOLD and provide as much stability as possible.
                    </p>

                    {/* Report Risk Note */}
                    <div className="mt-6 rounded-lg border bg-secondary/10 p-4">
                      <p className="text-sm text-muted-foreground">See any risk or suspicious activity? Please let us know.</p>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReportRisk}
                          aria-label="Report a risk"
                        >
                          Report a risk
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <h2 className="text-center text-2xl md:text-3xl font-bold">How to Join the Era: Buying $ANIME</h2>
        <p className="mt-3 text-center text-muted-foreground">Becoming a part of the $ANIME community is easy. Follow these simple steps:</p>
        <ol className="mt-6 space-y-3 list-decimal pl-6">
          <li><span className="font-semibold">Get a Wallet:</span> Download and set up a Solana wallet — we recommend <a href="https://phantom.com/download" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Phantom</a>.</li>
          <li><span className="font-semibold">Fund Your Wallet:</span> Buy Solana (SOL) on a major exchange (we recommend <a href="https://www.binance.com/referral/earn-together/refer-in-hotsummer/claim?hl=en&ref=GRO_20338_IALEN&utm_source=Lite_web_account" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Binance</a>) and send it to your Phantom wallet.</li>
          <li><span className="font-semibold">Go to a DEX:</span> Use Raydium or find us on <a href="https://dexscreener.com/solana/h5eyz1skumdwrddhucfnvsps1ns3lhf7wdtqmfdt8zwc" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">DEX Screener</a> (recommended).</li>
          <li><span className="font-semibold">Swap for $ANIME:</span> Connect your wallet, select SOL → $ANIME, and confirm the swap. Use our official contract address:</li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-secondary px-2 py-1 text-sm">{CONTRACT}</code>
          <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <h2 className="text-2xl md:text-3xl font-bold">The Conversation is Happening Now. Join Us.</h2>
        <p className="mt-3 text-muted-foreground">Follow our journey, share ideas, and connect with anime fans worldwide.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="glass"><a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener">Twitter (X)</a></Button>
          <Button asChild variant="glass"><a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener">Telegram</a></Button>
          <Button asChild variant="glass"><a href="https://discord.gg/EZ9wRhjr" target="_blank" rel="noreferrer noopener">Discord</a></Button>
          <Button asChild variant="glass"><a href="https://www.tiktok.com/@animedottoken" target="_blank" rel="noreferrer noopener">TikTok</a></Button>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-5xl border-t pt-6 text-center text-sm text-muted-foreground">
        <p>© 2025 AnimeDotToken | All Rights Reserved</p>
        <p className="mt-1">Official Contract: <code className="rounded-md bg-secondary px-2 py-0.5 text-xs">{CONTRACT}</code></p>
        <p className="mt-2">Disclaimer: Investing in cryptocurrency involves risk. This is not financial advice.</p>
      </footer>

      <script type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ANIME Token',
        url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080',
        sameAs: [
          'https://x.com/AnimeDotToken',
          'https://t.me/AnimeDotTokenCommunity',
          'https://discord.gg/EZ9wRhjr',
          'https://www.tiktok.com/@animedottoken'
        ]
      })}</script>
    </main>
  );
};

export default Index;
