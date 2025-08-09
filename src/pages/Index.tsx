import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

const Index = () => {
  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT);
    toast.success("Contract address copied");
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
          className="h-[320px] w-full object-cover md:h-[420px]"
        />
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="max-w-3xl rounded-xl border border-white/10 bg-black/40 p-6 md:p-10 backdrop-blur-md" style={{ backgroundImage: 'var(--gradient-hero)' }}>
            <div className="flex items-center gap-4">
              <img src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" alt="ANIME Token hexagon logo" className="h-12 w-12" loading="eager" />
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
                Beyond a Token. A New Era for Anime.
              </h1>
            </div>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Welcome to the official home of $ANIME, a truly community-driven project on Solana dedicated to building the #1 global hub for anime culture.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero">
                <a href="https://raydium.io/swap/" target="_blank" rel="noreferrer noopener">Buy $ANIME on Raydium</a>
              </Button>
              <Button asChild variant="glass">
                <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener">Join our Telegram</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
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
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>A Project You Can Trust. Verifiably.</CardTitle>
            <CardDescription>Transparency and security are the foundations of our community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="list-disc pl-5 space-y-2 text-left">
              <li><span className="font-semibold">Creator Wallet Emptied:</span> The original creator holds 0 tokens and has sold their entire supply.</li>
              <li><span className="font-semibold">99.99% Liquidity Locked:</span> The primary liquidity pool is locked.</li>
              <li><span className="font-semibold">Independently Audited:</span> Confirmed secure by community safety tools.</li>
            </ul>
            <div className="space-y-2">
              <a className="underline underline-offset-4" href="https://rugcheck.xyz/tokens/GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump" target="_blank" rel="noreferrer noopener">View RugCheck Report (Good Score)</a>
              <br />
              <a className="underline underline-offset-4" href="https://app.quickintel.io/scanner?type=token&chain=solana&contractAddress=GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump" target="_blank" rel="noreferrer noopener">View QuickIntel Report (Low Risk)</a>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-16 max-w-5xl">
        <h2 className="text-center text-2xl md:text-3xl font-bold">How to Join the Era: Buying $ANIME</h2>
        <p className="mt-3 text-center text-muted-foreground">Becoming a part of the $ANIME community is easy. Follow these simple steps:</p>
        <ol className="mt-6 space-y-3 list-decimal pl-6">
          <li><span className="font-semibold">Get a Wallet:</span> Download and set up a Solana wallet — we recommend <a href="https://phantom.com/download" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Phantom</a>.</li>
          <li><span className="font-semibold">Fund Your Wallet:</span> Buy Solana (SOL) on a major exchange (we recommend <a href="https://www.binance.com/referral/earn-together/refer-in-hotsummer/claim?hl=en&ref=GRO_20338_IALEN&utm_source=Lite_web_account" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Binance</a>) and send it to your Phantom wallet.</li>
          <li><span className="font-semibold">Go to a DEX:</span> Use Raydium or find us on <a href="https://dexscreener.com/solana/h5eyz1skumdwrddhucfnvsps1ns3lhf7wdtqmfdt8zwc" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">DEX Screener</a>.</li>
          <li><span className="font-semibold">Swap for $ANIME:</span> Connect your wallet, select SOL → $ANIME, and confirm the swap. Use our official contract address:</li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-secondary px-2 py-1 text-sm">{CONTRACT}</code>
          <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl text-center">
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
