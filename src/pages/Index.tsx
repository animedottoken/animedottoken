import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrustSecuritySection } from "@/components/TrustSecuritySection";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";

const Index = () => {
  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT);
    toast.success("Contract address copied");
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : "https://animedottoken.lovable.app";
  const shareText = "I just joined the ANIME Era on Solana! $ANIME";
  const shareUrlX = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
  const shareUrlTelegram = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;

  const copyShare = async () => {
    await navigator.clipboard.writeText(`${shareText} ${pageUrl}`);
    toast.success("Share text copied to clipboard");
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
          src="/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png"
          alt="ANIME.TOKEN 3:2 hero banner with anime characters and logo"
          loading="eager"
          decoding="async"
          className="w-full h-auto block"
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

      <TrustSecuritySection tokenAddress={CONTRACT} creatorWalletUrl="https://solscan.io/account/CJgzkuCyhcNXhGH6aKgrNsLwHXFwShTWma9vHN9ECz45#portfolio" />

      <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <h2 className="text-center text-2xl md:text-3xl font-bold">How to Join the Era: Buying $ANIME</h2>
        <p className="mt-3 text-center text-muted-foreground">Getting $ANIME and becoming a co-owner of this great project is easier than ever. Follow these simple steps:</p>
        <ol className="mt-6 space-y-5 list-decimal pl-6">
          <li>
            <span className="font-semibold">Step 1: Get a Digital Wallet</span>
            <div className="mt-2 flex items-center gap-3">
              <img
                src="/lovable-uploads/504c8ec2-905a-47f0-8aba-359f7b9907c6.png"
                alt="Phantom wallet logo"
                loading="lazy"
                decoding="async"
                className="h-6 w-auto"
              />
              <a href="https://phantom.com/download" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Download Phantom</a>
            </div>
            <p className="mt-1 text-muted-foreground">Install Phantom — our recommended Solana wallet for $ANIME.</p>
            <p className="mt-1 text-muted-foreground text-sm">If you need assistance or help, the complete guide is on the <a href="https://help.phantom.com/hc/en-us" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Phantom Help Center</a>.</p>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="px-0">Read more</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="mt-2 text-muted-foreground">Phantom is an app that serves as a secure and user-friendly cryptocurrency wallet. It allows you to create and manage digital wallets across multiple blockchains like Solana, Ethereum, and Polygon, all in one place. Designed to be intuitive for beginners and powerful for experienced users, Phantom makes it easy to explore and engage with the decentralized ecosystem while keeping your assets safe.</p>
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <span className="font-semibold">Step 2: Create Your Wallet</span>
            <p className="mt-1 text-muted-foreground">
              When creating your wallet, you have two options: a quick and convenient seedless login, or the traditional secret recovery phrase for full self-custody.
            </p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              <li><span className="font-medium">Recommended (Seedless Login):</span> Use your Google or Apple account and a PIN code for the quickest and easiest setup.</li>
              <li><span className="font-medium">Alternative (Secret Recovery Phrase):</span> Use the traditional 12-word recovery phrase method.</li>
            </ul>
            <p className="mt-1 text-muted-foreground text-sm">Need step-by-step instructions? See Phantom’s guide: <a href="https://help.phantom.com/hc/en-us/articles/8071074929043-How-to-create-a-new-Phantom-wallet" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">How to create a new Phantom wallet</a>.</p>
          </li>
          <li>
            <span className="font-semibold">Step 3: Fund Your Wallet</span>
            <p className="mt-1 text-muted-foreground">To start using Phantom, add cryptocurrency to your wallet.</p>
            <p className="mt-1 text-muted-foreground">We recommend using $SOL (Solana — the blockchain $ANIME runs on) or $USDC (USD-pegged stablecoin).</p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              <li>
                <span className="font-medium">Transfer from another wallet or exchange</span>. <a href="https://help.phantom.com/hc/en-us/articles/4406393831187-How-to-deposit-crypto-into-Phantom" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Deposit guide</a>.
              </li>
              <li>
                <span className="font-medium">Buy directly in Phantom</span>. <a href="https://help.phantom.com/hc/en-us/articles/4406543783571-How-to-buy-crypto-in-Phantom" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Buy guide</a>.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Step 4: Swap for $ANIME</span>
            <p className="mt-1 text-muted-foreground">Swap to $ANIME directly in Phantom on Solana.</p>
            <ol className="mt-2 list-decimal pl-5 text-muted-foreground">
              <li>Open Phantom and go to the Swap tab.</li>
              <li>Under Network, select Solana. In From, choose the token you funded with ($SOL or $USDC).</li>
              <li>
                In To, paste the official $ANIME contract address:
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="rounded-md bg-secondary px-2 py-1 text-sm">{CONTRACT}</code>
                  <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
                </div>
              </li>
              <li>Enter the amount, review the quote (including fees), and adjust slippage in Swap Settings if needed.</li>
              <li>Select Swap now and approve the transaction.</li>
              <li>Track the status in Activity; $ANIME will appear in your Tokens list.</li>
            </ol>
            <p className="mt-2 text-muted-foreground text-sm">Need more details? See Phantom's guide: <a href="https://help.phantom.com/hc/en-us/articles/6048249796243-How-to-swap-tokens-in-Phantom" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">How to swap tokens in Phantom</a>.</p>
          </li>
        </ol>

        <section className="mt-8">
          <h3 className="text-lg font-semibold">FAQ</h3>
          <ul className="mt-3 space-y-3 text-muted-foreground">
            <li>
              <span className="font-medium">What is the official $ANIME contract?</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-secondary px-2 py-1 text-sm">{CONTRACT}</code>
                <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
              </div>
            </li>
            <li>
              <span className="font-medium">I cannot find $ANIME in Phantom search.</span>
              <p>Paste the contract address above into the token field to ensure you select the correct token.</p>
            </li>
            <li>
              <span className="font-medium">What slippage should I use?</span>
              <p>Start at 1–3%. If a swap fails due to price impact, increase slightly and try again.</p>
            </li>
            <li>
              <span className="font-medium">More questions?</span>
              <p>Contact us on <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Telegram</a>, <a href="https://discord.gg/EZ9wRhjr" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Discord</a>, or <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">X (Twitter)</a>.</p>
            </li>
          </ul>
        </section>

        <script type="application/ld+json">{JSON.stringify({
          "@context":"https://schema.org",
          "@type":"FAQPage",
          "mainEntity":[
            { "@type":"Question", "name":"What is the official $ANIME contract?", "acceptedAnswer":{ "@type":"Answer", "text": CONTRACT } },
            { "@type":"Question", "name":"I cannot find $ANIME in Phantom search.", "acceptedAnswer":{ "@type":"Answer", "text":"Paste the official contract address into the token field to select the correct token." } },
            { "@type":"Question", "name":"What slippage should I use?", "acceptedAnswer":{ "@type":"Answer", "text":"Start at 1–3%. If a swap fails due to price impact, increase slightly and try again." } },
            { "@type":"Question", "name":"How can I contact you for more questions?", "acceptedAnswer":{ "@type":"Answer", "text":"Contact us on Telegram: https://t.me/AnimeDotTokenCommunity, Discord: https://discord.gg/EZ9wRhjr, or X (Twitter): https://x.com/AnimeDotToken." } }
          ]
        })}</script>

        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold">Congratulations!</h3>
          <p className="mt-2 text-muted-foreground">You are now not just part of this great project, but also its co-owner. By promoting it in your social circle, you can help it become more valuable, increasing your share in the project too.</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="glass">
              <a href={shareUrlX} target="_blank" rel="noreferrer noopener">Share on X/Twitter</a>
            </Button>
            <Button asChild variant="glass">
              <a href={shareUrlTelegram} target="_blank" rel="noreferrer noopener">Share on Telegram</a>
            </Button>
            <Button variant="glass" onClick={copyShare}>Share on TikTok</Button>
            <Button variant="glass" onClick={copyShare}>Share on Discord</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700" aria-labelledby="ambassador-heading">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border bg-card shadow-glow">
          <AspectRatio ratio={3 / 2}>
            <img
              src="/lovable-uploads/84a73bd8-9888-4628-be42-18212456e718.png"
              alt="Become an Ambassador – ANIME.TOKEN recruitment poster calling for the Anime Army"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </AspectRatio>
        </div>
        <h2 id="ambassador-heading" className="mt-6 text-2xl md:text-3xl font-bold">Become an Ambassador</h2>
        <p className="mt-3 text-muted-foreground md:max-w-3xl mx-auto">
          Our project is growing, and we are looking for passionate anime fans to join our core team. Help us manage our community platforms and shape the future of $ANIME.
        </p>
        <div className="mt-6">
          <Button asChild variant="hero">
            <a href="https://forms.gle/1pQZH89qi3x5AGUk6" target="_blank" rel="noreferrer noopener" aria-label="Apply to become an ANIME.TOKEN ambassador via Google Form">Apply Now</a>
          </Button>
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
        <p>© 2025 ANIME.TOKEN | All Rights Reserved</p>
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
