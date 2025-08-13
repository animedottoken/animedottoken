import { Helmet } from "react-helmet-async";
import { useState } from "react";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrustSecuritySection } from "@/components/TrustSecuritySection";
import { MarketCapChart } from "@/components/MarketCapChart";
import { NFTSupporterSection } from "@/components/NFTSupporterSection";
import { OwnershipCalculator } from "@/components/OwnershipCalculator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SiX, SiTelegram, SiDiscord, SiTiktok, SiInstagram, SiYoutube } from "react-icons/si";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";
const PAIR_ADDRESS = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc";
const TOTAL_SUPPLY = 974338302;

const Index = () => {
  const { tokenData } = useLivePrice(PAIR_ADDRESS);
  const holders = useTokenHolders(CONTRACT);
  const copyContract = async () => {
    await navigator.clipboard.writeText(CONTRACT);
    toast.success("Contract address copied");
  };

  const shareBase = "https://animedottoken.lovable.app";
  const pageUrl = shareBase;
  const sharePageUrl = `${shareBase}/share-army.html?v=12`;
  const shareImage = `${shareBase}/lovable-uploads/a2811316-aae4-4c0b-90dc-224e1322724f.png`;
  const shareText = "I just joined the @AnimeDotToken movement on #Solana. A community-revived project building the #1 global hub for #anime culture. Check out the vision and get involved! #ANIMEtoken $ANIME";
  const shareUrlX = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sharePageUrl)}`;
  const shareUrlTelegram = `https://t.me/share/url?url=${encodeURIComponent(sharePageUrl)}&text=${encodeURIComponent(shareText)}`;

  const copyShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "ANIME Token", text: shareText, url: sharePageUrl });
        return;
      }
    } catch (e) {
      // Fallback to clipboard if user cancels or share fails
    }
    await navigator.clipboard.writeText(`${shareText} ${sharePageUrl}`);
    toast.success("Share text copied to clipboard");
  };

  const copyForDiscord = async () => {
    await navigator.clipboard.writeText(`${shareText} ${sharePageUrl}`);
    toast("Copied for Discord", {
      action: {
        label: "Open Discord",
        onClick: () => window.open("https://discord.com/channels/@me", "_blank"),
      },
    });
  };

  const copyForTikTok = async () => {
    await navigator.clipboard.writeText(`${shareText} ${sharePageUrl}`);
    toast("Copied for TikTok", {
      description: "Paste the text into your post.",
      action: {
        label: "Open TikTok",
        onClick: () => window.open("https://www.tiktok.com/tiktokstudio/upload", "_blank"),
      },
    });
  };

  const copyForInstagram = async () => {
    await navigator.clipboard.writeText(`${shareText} ${sharePageUrl}`);
    toast("Copied for Instagram", {
      description: "Paste the text into your caption.",
      action: {
        label: "Open Instagram",
        onClick: () => window.open("https://www.instagram.com/create/select/", "_blank"),
      },
    });
  };

  const copyForYouTube = async () => {
    await navigator.clipboard.writeText(`${shareText} ${sharePageUrl}`);
    toast("Copied for YouTube", {
      description: "Paste the text into your video description.",
      action: {
        label: "Open YouTube",
        onClick: () => window.open("https://www.youtube.com/upload", "_blank"),
      },
    });
  };

  const [buyOpen, setBuyOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [step1Open, setStep1Open] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);
  const [step4Open, setStep4Open] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  // Promo images for social sharing (downloads use SEO-friendly filenames)
  const promoImages = [
    { src: "/lovable-uploads/e8b630de-1a90-47b0-9e15-3e1ae87bdccd.png", filename: "anime-token-characters-logo-banner.png", alt: "ANIME Token characters banner with logo" },
    { src: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png", filename: "anime-token-hooded-heroes-banner.png", alt: "ANIME.TOKEN banner with hooded figure and heroes" },
    { src: "/lovable-uploads/a2811316-aae4-4c0b-90dc-224e1322724f.png", filename: "congratulations-proud-anime-society-heroes.png", alt: "Congratulations proud member of Anime Society poster with heroes" },
    { src: "/lovable-uploads/4f7e8ad1-deee-43db-a4c9-0db403808de7.png", filename: "congratulations-anime-society-crowd-bw.png", alt: "Congratulations black and white anime crowd poster" },
    { src: "/lovable-uploads/b964ec40-31a7-483d-9cf3-f2fbd588edb8.png", filename: "congratulations-anime-society-bright.png", alt: "Congratulations bright colorful anime crowd poster" },
    { src: "/lovable-uploads/d23194df-c1d3-4302-ab13-67508624ecbc.png", filename: "congratulations-anime-society-dark.png", alt: "Congratulations dark themed anime crowd poster" },
    { src: "/lovable-uploads/8b8ade02-34e9-4e29-8fd3-38329767a814.png", filename: "congratulations-anime-society-bw-logo.png", alt: "Congratulations poster with large A logo in monochrome crowd" },
    { src: "/lovable-uploads/d54f33b2-028c-448c-847b-5ac1f2ac9105.png", filename: "congratulations-anime-society-dark-alt.png", alt: "Congratulations dark variant poster alternate" },
    { src: "/lovable-uploads/d0e5a634-f5fa-4206-9e71-da4892708c22.png", filename: "congratulations-anime-society-bright-alt.png", alt: "Congratulations bright variant poster alternate" },
    { src: "/lovable-uploads/b2e5b681-da7f-4c05-a16c-12bbd52df2b3.png", filename: "congratulations-anime-society-bright-alt-2.png", alt: "Congratulations bright variant poster second alternate" },
    { src: "/lovable-uploads/54b1f4dd-f6e8-4522-8afb-6708c6622cf8.png", filename: "anime-token-anime-girl-ui.png", alt: "Anime girl with futuristic UI and ANIME Token theme" },
    { src: "/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png", filename: "anime-token-hexagon-a.png", alt: "ANIME Token hexagon A logo" },
    { src: "/lovable-uploads/2d0b0a65-8c68-4d43-ace0-45ea6f8bea2b.png", filename: "anime-token-girl-sunset.png", alt: "Anime girl at sunset with ANIME Token logo" },
    { src: "/lovable-uploads/b6429f29-773a-4b38-9851-15a00b150f31.png", filename: "anime-token-blue-haired-1.png", alt: "Blue-haired anime character with ANIME Token logo" },
    { src: "/lovable-uploads/d0baaec8-b240-42ba-b15d-638dc9091518.png", filename: "anime-token-blue-haired-2.png", alt: "Blue-haired anime character with hexagon logo right" },
    { src: "/lovable-uploads/58338e0a-c014-4592-9025-72d92f0851e0.png", filename: "anime-token-blue-haired-3.png", alt: "Blue-haired anime character close-up with logo" },
    { src: "/lovable-uploads/2b1cb628-631d-4556-a5b8-0af2fddb836b.png", filename: "anime-token-banner-purple.png", alt: "Purple ANIME Token banner" },
    { src: "/lovable-uploads/b27ad849-b843-4ef7-b5af-3a941e9f0789.png", filename: "anime-token-banner-black.png", alt: "Black ANIME Token banner" },
    { src: "/lovable-uploads/172bbb91-3be7-4657-9a93-dcc7acb73474.png", filename: "anime-token-hooded-heroes-banner-2.png", alt: "ANIME.TOKEN banner with hooded figure and heroes variant" },
  ];
  
  const downloadAllPromo = async () => {
    try {
      toast.message("Preparing download...", { description: "Packing images..." });
      const zip = new JSZip();
      const folder = zip.folder("anime-token-promo")!;
      await Promise.all(promoImages.map(async (img) => {
        const res = await fetch(img.src);
        if (!res.ok) throw new Error(`Failed to fetch ${img.src}`);
        const blob = await res.blob();
        folder.file(img.filename, blob);
      }));
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anime-token-promo-pack.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success("Promo pack downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download all images");
    }
  };

  return (
    <main className="min-h-screen py-12 md:py-20 container">
      <Helmet>
        <title>ANIME Token | Official Community on Solana</title>
        <meta name="description" content="Official home of $ANIME on Solana. Community-driven vision, trust & verification, how to buy, and links to Telegram, X, Discord, and TikTok." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="ANIME Token | Official Community" />
        <meta property="og:description" content="$ANIME is a truly community-driven project on Solana." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:alt" content="ANIME Token on Solana — community-driven project" />
        <meta property="og:image:width" content="1216" />
        <meta property="og:image:height" content="640" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AnimeDotToken" />
        <meta name="twitter:creator" content="@AnimeDotToken" />
        <meta name="twitter:title" content="ANIME Token | Official Community on Solana" />
        <meta name="twitter:description" content="$ANIME is a truly community-driven project on Solana." />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content="ANIME Token on Solana — community-driven project" />
        <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="" />
        <link
          rel="preload"
          as="image"
          href="https://images.weserv.nl/?url=animedottoken.lovable.app/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png&w=1024&output=webp&q=80"
          imageSrcSet="
            https://images.weserv.nl/?url=animedottoken.lovable.app/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png&w=640&output=webp&q=80 640w,
            https://images.weserv.nl/?url=animedottoken.lovable.app/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png&w=1024&output=webp&q=80 1024w,
            https://images.weserv.nl/?url=animedottoken.lovable.app/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png&w=1536&output=webp&q=80 1536w
          "
          imageSizes="(min-width: 1024px) 1024px, 100vw"
          fetchPriority="high"
        />
      </Helmet>

      {/* NFT Program Banner */}
      <div className="mb-6 mx-auto max-w-5xl">
        <div
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-4 cursor-pointer hover:from-primary/15 hover:border-primary/30 transition-all duration-300"
          onClick={() => document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎖</span>
              <div>
                <h3 className="font-semibold text-foreground">ANIME.TOKEN NFT Program</h3>
                <p className="text-sm text-muted-foreground">Free NFTs for supporters</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <header className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card shadow-glow">
        <AspectRatio ratio={3 / 2}>
          <picture>
            <img
              src="https://animedottoken.lovable.app/lovable-uploads/f67ec55c-c64b-4112-8014-1b48438672eb.png"
              alt="ANIME Token 3:2 hero banner with anime characters and logo"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/og-anime.jpg"; }}
              className="w-full h-full object-cover block"
            />
          </picture>
        </AspectRatio>
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
              <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
                <SiX className="h-4 w-4" aria-hidden="true" />
                Follow us on X (Twitter)
              </a>
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
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">The Power of Community: A Decentralized Future</h2>
          <p className="mt-3 text-muted-foreground max-w-4xl mx-auto">
            Our ecosystem is owned by its community. With a decentralized distribution, even a small stake can represent a significant voice in the project. Use the live calculator below to see how support translates into a real share of the network.
          </p>
        </div>
        
        <div className="mb-8">
          <OwnershipCalculator />
        </div>

        <div className="text-center">
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Join over{" "}
            <span className="font-bold text-foreground">
              {holders ? `${holders.toLocaleString()}` : "1,300"}
            </span>{" "}
            holders and become a key member of our movement. Your contribution, no matter the size, helps us build the #1 global hub for anime culture.
          </p>
        </div>
        
        <div className="mt-8">
          <MarketCapChart />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <h2 className="text-center text-2xl md:text-3xl font-bold">How to Join the Era: Buying $ANIME</h2>
        <p className="mt-3 text-center text-muted-foreground">Getting $ANIME and becoming a part of this great movement is easier than ever. Follow these 4 simple steps:</p>
        <ul className="mt-6 space-y-5 list-none pl-0">
          <li>
            <Collapsible open={step1Open} onOpenChange={setStep1Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 1: Get a Digital Wallet App</span>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="px-0 mt-1">{step1Open ? "Hide details" : "Show details"}</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
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
                <p className="mt-2 text-muted-foreground">Phantom is an app that serves as a secure and user-friendly cryptocurrency wallet. It allows you to create and manage digital wallets across multiple blockchains like Solana, Ethereum, and Polygon, all in one place. Designed to be intuitive for beginners and powerful for experienced users, Phantom makes it easy to explore and engage with the decentralized ecosystem while keeping your assets safe.</p>
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <Collapsible open={step2Open} onOpenChange={setStep2Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 2: Create Your Wallet</span>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="px-0 mt-1">{step2Open ? "Hide details" : "Show details"}</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <p className="mt-1 text-muted-foreground">
                  When creating your wallet, you have two options: a quick and convenient seedless login, or the traditional secret recovery phrase for full self-custody.
                </p>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                  <li><span className="font-medium">Recommended (Seedless Login):</span> Use your Google or Apple account and a PIN code for the quickest and easiest setup.</li>
                  <li><span className="font-medium">Alternative (Secret Recovery Phrase):</span> Use the traditional 12-word recovery phrase method.</li>
                </ul>
                <p className="mt-1 text-muted-foreground text-sm">Need step-by-step instructions? See Phantom’s guide: <a href="https://help.phantom.com/hc/en-us/articles/8071074929043-How-to-create-a-new-Phantom-wallet" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">How to create a new Phantom wallet</a>.</p>
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <Collapsible open={step3Open} onOpenChange={setStep3Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 3: Fund Your Wallet</span>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="px-0 mt-1">{step3Open ? "Hide details" : "Show details"}</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <Collapsible open={step4Open} onOpenChange={setStep4Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 4: Swap for $ANIME</span>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="px-0 mt-1">{step4Open ? "Hide details" : "Show details"}</Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <p className="mt-1 text-muted-foreground">Swap to $ANIME directly in Phantom on Solana.</p>
                <ol className="mt-2 list-decimal pl-5 text-muted-foreground">
                  <li>Open Phantom and go to the Swap tab.</li>
                  <li>Under Network, select Solana. In From, choose the token you funded with ($SOL or $USDC).</li>
                  <li>
                    In To, paste the official $ANIME contract address:
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-secondary px-2 py-1 text-xs sm:text-sm break-all max-w-full inline-block">{CONTRACT}</code>
                      <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
                    </div>
                  </li>
                  <li>Enter the amount, review the quote (including fees), and adjust slippage in Swap Settings if needed.</li>
                  <li>Select Swap now and approve the transaction.</li>
                  <li>Track the status in Activity; $ANIME will appear in your Tokens list.</li>
                </ol>
                <p className="mt-2 text-muted-foreground text-sm">Need more details? See Phantom's guide: <a href="https://help.phantom.com/hc/en-us/articles/6048249796243-How-to-swap-tokens-in-Phantom" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">How to swap tokens in Phantom</a>.</p>
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>

        <div className="mt-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Congratulations!</h2>
          <div className="mx-auto mt-4 max-w-3xl overflow-hidden rounded-xl border bg-card shadow-glow">
          <picture>
            <img
              src="https://animedottoken.lovable.app/lovable-uploads/fb44cdff-1dd5-4a30-80bd-01164ee49259.png"
              alt="Congratulations — Proud Anime Society Member poster"
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/og-anime.jpg"; }}
              className="w-full h-auto object-cover"
            />
          </picture>
          </div>
          <p className="mt-3 text-muted-foreground">You are now not just a holder, but a key member of our community. By sharing it in your social circle, you help grow our movement and build the #1 global hub for anime culture.</p>
          <div className="mt-5 space-y-4">
            <div aria-labelledby="share-social">
              <h3 id="share-social" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social</h3>
              <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="glass">
                  <a href={shareUrlX} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
                    <SiX className="h-4 w-4" aria-hidden="true" />
                    Share on X/Twitter
                  </a>
                </Button>
                <Button variant="glass" onClick={() => window.open("https://www.instagram.com/create/select/", "_blank")}>
                  <SiInstagram className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open Instagram
                </Button>
              </div>
            </div>
            <div aria-labelledby="share-community">
              <h3 id="share-community" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community</h3>
              <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="glass">
                  <a href={shareUrlTelegram} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
                    <SiTelegram className="h-4 w-4" aria-hidden="true" />
                    Share on Telegram
                  </a>
                </Button>
                <Button variant="glass" onClick={() => window.open("https://discord.com/channels/@me", "_blank")}>
                  <SiDiscord className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open Discord
                </Button>
              </div>
            </div>
            <div aria-labelledby="share-video">
              <h3 id="share-video" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video</h3>
              <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="glass" onClick={() => window.open("https://www.tiktok.com/tiktokstudio/upload", "_blank")}>
                  <SiTiktok className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open TikTok
                </Button>
                <Button variant="glass" onClick={() => window.open("https://www.youtube.com/upload", "_blank")}>
                  <SiYoutube className="h-4 w-4 mr-2" aria-hidden="true" />
                  Open YouTube
                </Button>
              </div>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-4 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
          {/* minimal link only */}
          <Collapsible open={promoOpen} onOpenChange={setPromoOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="px-0">{promoOpen ? "Hide promo package" : "Show promo package"}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 text-xs text-muted-foreground">1) Download an image or all 2) Copy text 3) Post on X or Telegram (attach the image).</p>
              <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="hero" onClick={downloadAllPromo}>Download All</Button>
                <Button 
                  variant="glass" 
                  onClick={async () => { 
                    await navigator.clipboard.writeText(`${shareText} @AnimeDotToken`); 
                    toast.success("Text copied"); 
                  }}
                >
                  Copy Text
                </Button>
                <Button asChild variant="glass">
                  <a 
                    href={`https://x.com/intent/post?text=${encodeURIComponent(shareText + " @AnimeDotToken")}`}
                    target="_blank" 
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2"
                  >
                    <SiX className="h-4 w-4" aria-hidden="true" />
                    Open Tweet Composer
                  </a>
                </Button>
                <Button asChild variant="glass">
                  <a
                    href={`https://t.me/share/url?text=${encodeURIComponent(shareText + " @AnimeDotToken")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2"
                  >
                    <SiTelegram className="h-4 w-4" aria-hidden="true" />
                    Open Telegram
                  </a>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {promoImages.map((img) => (
                  <article key={img.src} className="rounded-md border bg-card/50 p-3">
                    <img src={img.src} alt={img.alt} loading="lazy" decoding="async" className="w-full h-auto rounded" />
                    <div className="mt-2 flex justify-center">
                      <Button asChild variant="hero">
                        <a href={img.src} download={img.filename} aria-label={`Download ${img.alt}`}>Download Image</a>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold">FAQ</h3>
          <ul className="mt-3 space-y-4">
            <li className="rounded-md border bg-card/50 p-4">
              <span className="text-base md:text-lg font-semibold">What is the official $ANIME contract?</span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-secondary px-2 py-1 text-xs sm:text-sm break-all max-w-full inline-block">{CONTRACT}</code>
                <Button variant="outline" size="sm" onClick={copyContract}>Copy</Button>
              </div>
            </li>
          </ul>

          <Collapsible className="mt-2" open={faqOpen} onOpenChange={setFaqOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="px-0 text-primary text-xs">{faqOpen ? "Hide all answers" : "See all answers"}</Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-3 space-y-4">
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">I cannot find $ANIME in Phantom search.</span>
                  <p className="mt-2 text-muted-foreground">Paste the contract address above into the token field to ensure you select the correct token.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What slippage should I use?</span>
                  <p className="mt-2 text-muted-foreground">Start at 1–3%. If a swap fails due to price impact, increase slightly and try again.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">More questions?</span>
                  <p className="mt-2 text-muted-foreground">Contact us on <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Telegram</a>, <a href="https://discord.gg/EZ9wRhjr" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Discord</a>, or <a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">X (Twitter)</a>.</p>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
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

      </section>


      <section className="mx-auto mt-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700" aria-labelledby="ambassador-heading">
        <h2 id="ambassador-heading" className="text-2xl md:text-3xl font-bold">Become an Ambassador</h2>
        <div className="mx-auto mt-4 max-w-md overflow-hidden rounded-lg border bg-card shadow-glow">
          <AspectRatio ratio={3 / 2}>
            <picture>
              <img
                src="https://animedottoken.lovable.app/lovable-uploads/84a73bd8-9888-4628-be42-18212456e718.png"
                alt="Become an Ambassador – ANIME.TOKEN recruitment poster calling for the Anime Army"
                loading="lazy"
                decoding="async"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/og-anime.jpg"; }}
                className="h-full w-full object-cover"
              />
            </picture>
          </AspectRatio>
        </div>
        <p className="mt-3 text-muted-foreground md:max-w-3xl mx-auto">
          Our project is growing, and we are looking for passionate anime fans to join our core team. Help us manage our community platforms and shape the future of $ANIME.
        </p>
        <div className="mt-6">
          <Button asChild variant="hero">
            <a href="https://forms.gle/1pQZH89qi3x5AGUk6" target="_blank" rel="noreferrer noopener" aria-label="Apply to become an ANIME.TOKEN ambassador via Google Form">Apply Now</a>
          </Button>
        </div>
      </section>

      {/* NFT Supporter Program Section */}
      <NFTSupporterSection />

      <section className="mx-auto mt-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <h2 className="text-2xl md:text-3xl font-bold">The Conversation is Happening Now. Join Us.</h2>
        <p className="mt-3 text-muted-foreground">Follow our journey, share ideas, and connect with anime fans worldwide.</p>
        <div className="mt-6 space-y-4">
          <div aria-labelledby="join-social">
            <h3 id="join-social" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social</h3>
            <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="glass"><a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiX className="h-4 w-4" aria-hidden="true" />Twitter (X)</a></Button>
              <Button asChild variant="glass"><a href="https://www.instagram.com/animedottoken/?hl=en" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiInstagram className="h-4 w-4" aria-hidden="true" />Instagram</a></Button>
            </div>
          </div>
          <div aria-labelledby="join-community">
            <h3 id="join-community" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community</h3>
            <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="glass"><a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiTelegram className="h-4 w-4" aria-hidden="true" />Telegram</a></Button>
              <Button asChild variant="glass"><a href="https://discord.gg/EZ9wRhjr" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiDiscord className="h-4 w-4" aria-hidden="true" />Discord</a></Button>
            </div>
          </div>
          <div aria-labelledby="join-video">
            <h3 id="join-video" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Video</h3>
            <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="glass"><a href="https://www.tiktok.com/@animedottoken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiTiktok className="h-4 w-4" aria-hidden="true" />TikTok</a></Button>
              <Button asChild variant="glass"><a href="https://www.youtube.com/@AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiYoutube className="h-4 w-4" aria-hidden="true" />YouTube</a></Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-5xl border-t pt-6 text-center text-sm text-muted-foreground">
        <p>© 2024 ANIME.TOKEN | All Rights Reserved</p>
        <p className="mt-1 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span>Official Contract:</span>
          <code className="rounded-md bg-secondary px-2 py-0.5 text-xs sm:text-sm break-all max-w-full">
            {CONTRACT}
          </code>
          <Button variant="outline" size="sm" onClick={copyContract} aria-label="Copy contract address">Copy</Button>
        </p>
        <p className="mt-2">Disclaimer: Investing in cryptocurrency involves risk. This is not financial advice.</p>
        <p className="mt-2">Website created with <a href="https://lovable.dev/invite/f59fc72f-7a4c-44ba-9735-226d9f24e4b0" target="_blank" rel="noopener noreferrer sponsored" className="underline underline-offset-4">Lovable</a>.</p>
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
          'https://www.tiktok.com/@animedottoken',
          'https://www.instagram.com/animedottoken/',
          'https://www.youtube.com/@AnimeDotToken'
        ]
      })}</script>
    </main>
  );
};

export default Index;
