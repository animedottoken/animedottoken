import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense, useMemo, useEffect } from "react";
import JSZip from "jszip";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import ViewModeToggle from "@/components/ViewModeToggle";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";


// Lazy load heavy components with higher priority for desktop
const MarketCapChart = lazy(() => 
  import("@/components/MarketCapChart").then(m => ({ default: m.MarketCapChart }))
);
const FeaturedCommunityContent = lazy(() => 
  import("@/components/FeaturedCommunityContent").then(m => ({ default: m.FeaturedCommunityContent }))
);

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrustSecuritySection } from "@/components/TrustSecuritySection";
import { NFTSupporterSection } from "@/components/NFTSupporterSection";
import { NFTPreviewSection } from "@/components/NFTPreviewSection";
import { OwnershipCalculator } from "@/components/OwnershipCalculator";
import { LiveStatsCounter } from "@/components/LiveStatsCounter";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// Social media icons and chevron for collapsibles
import { SiX, SiTelegram, SiDiscord, SiTiktok, SiInstagram, SiYoutube, SiFacebook } from "react-icons/si";
import { ChevronDown, Copy, Share, Handshake, BarChart3, ShoppingCart, HelpCircle } from "lucide-react";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { scrollToHash } from "@/lib/scroll";

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

  // Use the production domain for social sharing to ensure proper OG metadata
  const shareBase = "https://animedottoken.com";
  const pageUrl = shareBase;
  const sharePageUrl = `${shareBase}/share-army.html?v=12`;
  const shareImage = `${shareBase}/lovable-uploads/d91f7864-13dd-4a41-8130-d0f197707870.png`;
  const shareText = "I just joined the @AnimeDotToken Ownership Economy on #Solana. A community-owned ecosystem where users become stakeholders. Don't just be a user. Be an owner! #ANIMEtoken $ANIME";
  const shareUrlX = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sharePageUrl)}`;
  const shareUrlTelegram = `https://t.me/share/url?url=${encodeURIComponent(sharePageUrl)}&text=${encodeURIComponent(shareText)}`;

  // Memoize expensive computations for better performance
  const shareUrls = useMemo(() => ({
    x: shareUrlX,
    telegram: shareUrlTelegram,
  }), [shareUrlX, shareUrlTelegram]);

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

  // Promo images for social sharing (downloads use SEO-friendly filenames)
  const promoImages = [
    { src: "/lovable-uploads/e8b630de-1a90-47b0-9e15-3e1ae87bdccd.png", filename: "anime-token-characters-logo-banner.png", alt: "ANIME Token characters banner with logo" },
    { src: "/lovable-uploads/1bebfca8-6d92-4791-bc30-303e161808a0.png", filename: "anime-token-hooded-heroes-banner.png", alt: "ANIME.TOKEN banner with hooded figure and heroes" },
    { src: "/lovable-uploads/d91f7864-13dd-4a41-8130-d0f197707870.png?v=13", filename: "congratulations-anime-token-celebration.png", alt: "Congratulations ANIME Token celebration with anime characters" },
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

  const memoizedPromoImages = useMemo(() => promoImages, []);

  const downloadAllPromo = async () => {
    const zip = new JSZip();
    const promises = memoizedPromoImages.map(async (img) => {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        zip.file(img.filename, blob);
      } catch (error) {
        console.error(`Failed to fetch ${img.src}:`, error);
      }
    });
    
    await Promise.all(promises);
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anime-token-promo-pack.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Promo pack downloaded!");
  };

  // Optimize images with intersection observer for better mobile performance
  useEffect(() => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '50px 0px' });

      images.forEach((img) => imageObserver.observe(img));
      
      return () => imageObserver.disconnect();
    }
  }, []);

  // Native hash navigation will handle deep links to sections

  // Removed custom hashchange handler to rely on native anchor behavior

  const [buyOpen, setBuyOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [step1Open, setStep1Open] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);
  const [step4Open, setStep4Open] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <ViewModeProvider>
      <main className="min-h-screen py-6 md:py-8 container mx-auto px-4 max-w-6xl overflow-x-hidden">
      <Helmet>
        <title>ANIME.TOKEN | Ownership Economy Platform | A New Internet Money Era on Solana</title>
        <meta name="description" content="Join the Ownership Economy with ANIME.TOKEN on Solana. Don't just be a user. Be an owner. NFT marketplace, community governance, and stakeholder benefits." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="ANIME.TOKEN | Ownership Economy Platform | A New Internet Money Era on Solana" />
        <meta property="og:description" content="$ANIME powers the Ownership Economy - a community-owned ecosystem where users become stakeholders." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:alt" content="ANIME Token on Solana — community-driven project" />
        <meta property="og:image:width" content="1216" />
        <meta property="og:image:height" content="640" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AnimeDotToken" />
        <meta name="twitter:creator" content="@AnimeDotToken" />
        <meta name="twitter:title" content="ANIME.TOKEN | Ownership Economy Platform | A New Internet Money Era on Solana" />
        <meta name="twitter:description" content="$ANIME powers the Ownership Economy - a community-owned ecosystem where users become stakeholders." />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content="ANIME Token on Solana — community-driven project" />
        <link rel="preconnect" href="https://073d74a6-99d5-42cc-8d2e-4144164f2d85.lovableproject.com" crossOrigin="" />
        <link
          rel="preload"
          as="image"
          href="/lovable-uploads/35f96dc8-741f-4cfa-8d07-d0019a55a758.png"
          fetchPriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png"
          fetchPriority="high"
        />
      </Helmet>

      {/* Ownership Economy Banner */}
      <div className="mb-6 mx-auto max-w-5xl">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-3 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💎</span>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Ownership Economy Platform</h3>
                <p className="text-xs text-muted-foreground">Don't just be a user. Be an owner.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:inline">How to browse this page</span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">View Modes</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Overview:</strong> Shows only headlines and subheadlines. Click "Read more" to expand sections.
                      </div>
                      <div>
                        <strong>Summary:</strong> Includes key details with expandable sections for full content.
                      </div>
                      <div>
                        <strong>Full Details:</strong> Expands all sections to show complete information.
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <ViewModeToggle />
            </div>
          </div>
        </div>
      </div>

      <header className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card shadow-glow">
        <AspectRatio ratio={3 / 2}>
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-background animate-pulse">
            <img
              src="/lovable-uploads/35f96dc8-741f-4cfa-8d07-d0019a55a758.png"
              alt="ANIME.TOKEN hero banner showcasing the ownership economy platform on Solana"
              className="w-full h-full object-cover block transition-opacity duration-500"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              onLoad={(e) => {
                const container = e.currentTarget.parentElement?.parentElement;
                if (container) container.classList.remove('animate-pulse');
                e.currentTarget.style.opacity = '1';
              }}
              onError={(e) => {
                e.currentTarget.src = '/images/og-anime.jpg';
              }}
              style={{ opacity: 0 }}
            />
          </div>
        </AspectRatio>
      </header>
      <div className="mx-auto max-w-5xl px-6 mt-6 md:mt-8">
        <div className="text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-3">
            <img 
              src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" 
              alt="ANIME Token hexagon logo" 
              className="h-16 w-16 md:h-20 md:w-20" 
              loading="eager" 
              decoding="sync"
              fetchPriority="high"
            />
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              The Ownership Economy on Solana.
            </h1>
          </div>
          <p className="mt-3 md:mt-4 text-muted-foreground md:text-lg max-w-4xl mx-auto">
            Mint, trade, and collect on a transparent, community-owned ecosystem. Don't just be a user—be an owner.
          </p>
          
          <LiveStatsCounter />
        </div>
      </div>

      {/* 2. PRODUCT SECTION - NFT Minting & Marketplace */}
      <div className="scroll-mt-20">
        <NFTPreviewSection />
      </div>

      {/* 3. PHILOSOPHY SECTION - Ownership Economy + Live Calculator */}
      <section id="ownership-calculator" className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700 ownership-calculator scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8 text-violet-400" />
            The Ownership Economy: Where Users Become Owners
          </h2>
          <p className="mt-3 text-muted-foreground max-w-4xl mx-auto">
            In the Ownership Economy, communities control their destiny. With a decentralized token distribution, even modest participation translates to meaningful ownership. Use the live calculator below to see how your contribution translates into real ownership of the ecosystem.
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
            holders and become a key stakeholder in our Ownership Economy. Your contribution, no matter the size, helps us build a community-owned ecosystem where users become owners.
          </p>
        </div>
        
        <div id="market-cap-chart" className="mt-8 market-cap-chart scroll-mt-20">
          <Suspense fallback={<div className="animate-pulse bg-muted/20 rounded-lg h-64"></div>}>
            <MarketCapChart />
          </Suspense>
        </div>
      </section>

      {/* 4. PROOF SECTION - Trust & Security */}
      <div id="trust-security-section" className="trust-security-section scroll-mt-20">
        <TrustSecuritySection tokenAddress={CONTRACT} creatorWalletUrl="https://solscan.io/account/CJgzkuCyhcNXhGH6aKgrNsLwHXFwShTWma9vHN9ECz45#portfolio" />
      </div>

      {/* 5. COMMUNITY SECTION - ANIME ARMY */}
      <div id="nft-supporter-section" className="scroll-mt-20">
        <NFTSupporterSection />
      </div>

      {/* 6. SOCIAL PROOF & FINAL CTA */}
      <div id="featured-community-content" className="featured-community-content scroll-mt-20">
        <Suspense fallback={<div className="animate-pulse bg-muted/20 rounded-lg min-h-[420px]"></div>}>
          <FeaturedCommunityContent />
        </Suspense>
      </div>

      {/* Prominent How to Buy Button */}
      <section className="mx-auto mt-12 mb-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
        <Button 
          size="lg"
          className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground font-bold text-lg px-8 py-6 h-auto shadow-elevated hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          onClick={() => scrollToHash('how-to-buy')}
        >
          Join the Ownership Economy
        </Button>
      </section>

      <section id="how-to-buy" className="mx-auto mt-16 max-w-5xl animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
        <h2 className="text-center text-2xl md:text-3xl font-bold flex items-center justify-center gap-3">
          <ShoppingCart className="w-8 h-8 text-violet-400" />
          How to Join the Ownership Economy: Buying $ANIME
        </h2>
        <p className="mt-3 text-center text-muted-foreground">Getting $ANIME and becoming a stakeholder in the Ownership Economy is easier than ever. Follow these 4 simple steps:</p>
        
        <ul className="mt-6 space-y-5 list-none pl-0">
          <li>
            <Collapsible open={step1Open} onOpenChange={setStep1Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 1: Get a Digital Wallet App</span>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="px-0 mt-1">{step1Open ? "Hide details" : "Show details"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step1Open ? "rotate-180" : ""}`} /></Button>
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
                  <Button variant="link" size="sm" className="px-0 mt-1">{step2Open ? "Hide details" : "Show details"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step2Open ? "rotate-180" : ""}`} /></Button>
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
                  <Button variant="link" size="sm" className="px-0 mt-1">{step3Open ? "Hide details" : "Show details"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step3Open ? "rotate-180" : ""}`} /></Button>
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
                  <Button variant="link" size="sm" className="px-0 mt-1">{step4Open ? "Hide details" : "Show details"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step4Open ? "rotate-180" : ""}`} /></Button>
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
                      <code className="rounded-md bg-secondary px-2 py-1 text-xs sm:text-sm break-all max-w-full inline-block flex-1">{CONTRACT}</code>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={copyContract}>
                        <Copy className="h-4 w-4" />
                      </Button>
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
          <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-3">
            <Handshake className="w-8 h-8 text-primary" />
            Congratulations, Stakeholder!
          </h2>
          <div className="mx-auto mt-4 max-w-3xl overflow-hidden rounded-xl border bg-card shadow-glow">
          <picture>
            <img
              src="/lovable-uploads/200d1789-179d-4077-9b63-356f00243e4c.png"
              alt="ANIME Token — Stakeholder ownership artwork"
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/og-anime.jpg"; }}
              className="w-full h-auto object-cover"
            />
          </picture>
          </div>
          <p className="mt-3 text-muted-foreground mb-2">You are now an owner, not just a holder. Welcome to the ANIME.TOKEN Ownership Economy. By joining us, you help build a transparent, community-owned ecosystem where stakeholders shape the future.</p>
          <p className="text-sm text-muted-foreground/80">Share your new role as a stakeholder and invite others to join the movement.</p>
          <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-4 justify-center items-center px-4">
            {/* Main platforms */}
            <Button asChild variant="glass" size="lg">
              <a href={shareUrls.x} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2">
                <SiX className="h-5 w-5" />
                Share on X (Twitter)
              </a>
            </Button>
            
            <Button onClick={copyForDiscord} variant="glass" size="lg" className="inline-flex items-center gap-2">
              <SiDiscord className="h-5 w-5" />
              Copy for Discord
            </Button>

            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  More platforms
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 w-56 bg-card border shadow-lg">
                <DropdownMenuItem asChild>
                  <a href={shareUrls.telegram} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 w-full">
                    <SiTelegram className="h-4 w-4" />
                    Share on Telegram
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyShare} className="inline-flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy share text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <section className="mx-auto mt-4 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700">
          {/* minimal link only */}
          <Collapsible open={promoOpen} onOpenChange={setPromoOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="px-0">{promoOpen ? "Hide promo package" : "Show promo package"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${promoOpen ? "rotate-180" : ""}`} /></Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 text-xs text-muted-foreground">1) Download an image or all 2) Copy text 3) Post on X or Telegram (attach the image).</p>
              <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button variant="hero" onClick={downloadAllPromo}>Download All</Button>
                <Button 
                  variant="glass" 
                  className="inline-flex items-center gap-2"
                  onClick={async () => { 
                    await navigator.clipboard.writeText(`${shareText} @AnimeDotToken`); 
                    toast.success("Text copied to clipboard!"); 
                  }}
                >
                  <Copy className="h-4 w-4" />
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                {memoizedPromoImages.map((img) => (
                  <article key={img.src} className="rounded-md border bg-card/50 p-3">
                    <ImageLazyLoad
                      src={img.src} 
                      alt={img.alt} 
                      className="w-full h-auto rounded"
                      loading="lazy"
                      decoding="async"
                    />
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

      <section id="faq-section" className="mx-auto mt-16 max-w-5xl scroll-mt-20">
        <h3 className="text-center text-3xl md:text-4xl font-semibold mb-4 flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8 text-violet-400" />
          <span className="text-foreground">F</span><span className="text-foreground">A</span><span className="text-foreground">Q</span>s (Frequented Answers & Questions)
        </h3>
          <ul className="mt-3 space-y-4">
            <li className="rounded-md border bg-card/50 p-4">
              <span className="text-base md:text-lg font-semibold">What is the official $ANIME contract address?</span>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-secondary px-2 py-1 text-xs sm:text-sm break-all w-full block">{CONTRACT}</code>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={copyContract}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </li>
          </ul>

          <Collapsible className="mt-2" open={faqOpen} onOpenChange={setFaqOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="px-0 text-primary">{faqOpen ? "See less FAQs (Frequented Answers & Questions)" : "See more FAQs (Frequented Answers & Questions)"} <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${faqOpen ? "rotate-180" : ""}`} /></Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-3 space-y-4">
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">I can't find $ANIME in my wallet's swap search. What do I do?</span>
                  <p className="mt-2 text-muted-foreground">Some wallet apps may not list new tokens immediately. To find it, simply copy the official contract address above and paste it directly into the token selection field in your wallet's swap interface.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What is the utility of the $ANIME token?</span>
                  <p className="mt-2 text-muted-foreground">$ANIME is the official utility token of our ecosystem. Its primary function is to power exclusive features on the ANIME Marketplace. This includes our Boost System, which allows you to promote your listings for greater visibility. As we grow, the token will be essential for other features like community governance (voting) and accessing special mints. Our goal is to make $ANIME the key that unlocks the best experiences on our platform.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What are the fees for selling on the ANIME Marketplace?</span>
                  <p className="mt-2 text-muted-foreground">We believe in transparency. A small, flat fee of 2.5% is applied to every successful sale on the marketplace. This fee is crucial for the project's sustainability and is reinvested directly into funding development, marketing initiatives, and community rewards.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What is the 'Boost System'?</span>
                  <p className="mt-2 text-muted-foreground">The Boost System is our unique promotional feature that allows you to get your listings seen by more people. It works like an auction: by using your $ANIME tokens, you can place a 'boost' on your item. Listings with the highest boosts get the top ranks on our marketplace for 24 hours.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">Is there a tax on buying or selling the $ANIME token?</span>
                  <p className="mt-2 text-muted-foreground">No. The $ANIME token contract has a 0% trading tax. This ensures that you get the most out of your trades on decentralized exchanges (DEXs). A 0% tax is also a critical feature that makes our token compatible with major centralized exchanges for potential future listings.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">Do I have to pay taxes on my profits?</span>
                  <p className="mt-2 text-muted-foreground">The ANIME Project and its community contributors do not provide financial or tax advice. You are solely responsible for handling your own tax obligations in accordance with the laws of your country. To assist you, the marketplace will provide a feature in your user profile to download a .CSV file of your entire transaction history.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">Who is leading The ANIME Project?</span>
                  <p className="mt-2 text-muted-foreground">The ANIME Project is a decentralized movement led by a dedicated, global community of core contributors. Our reputation is built on public, on-chain actions like the burned LP and the transparent Revival Wallet. As the project hits significant milestones, the core contributors are prepared to attach their public profiles to the project to further strengthen trust.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What slippage should I use when buying?</span>
                  <p className="mt-2 text-muted-foreground">Start with a slippage setting of 1-3%. If a transaction fails due to price movement, you may need to increase it slightly and try again.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">I have more questions. Where can I ask?</span>
                  <p className="mt-2 text-muted-foreground">Our community is always active and ready to help. The best place to ask questions is in our official <a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Telegram</a> or <a href="https://discord.com/invite/HmSJdT5MRX" target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Discord</a> channels.</p>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context":"https://schema.org",
              "@type":"FAQPage",
              "mainEntity":[
                { "@type":"Question", "name":"What is the official $ANIME contract address?", "acceptedAnswer":{ "@type":"Answer", "text": CONTRACT } },
                { "@type":"Question", "name":"I can't find $ANIME in my wallet's swap search. What do I do?", "acceptedAnswer":{ "@type":"Answer", "text":"Some wallet apps may not list new tokens immediately. To find it, simply copy the official contract address above and paste it directly into the token selection field in your wallet's swap interface." } },
                { "@type":"Question", "name":"What is the utility of the $ANIME token?", "acceptedAnswer":{ "@type":"Answer", "text":"$ANIME is the official utility token of our ecosystem. Its primary function is to power exclusive features on the ANIME Marketplace. This includes our Boost System, which allows you to promote your listings for greater visibility. As we grow, the token will be essential for other features like community governance (voting) and accessing special mints. Our goal is to make $ANIME the key that unlocks the best experiences on our platform." } },
                { "@type":"Question", "name":"What are the fees for selling on the ANIME Marketplace?", "acceptedAnswer":{ "@type":"Answer", "text":"We believe in transparency. A small, flat fee of 2.5% is applied to every successful sale on the marketplace. This fee is crucial for the project's sustainability and is reinvested directly into funding development, marketing initiatives, and community rewards." } },
                { "@type":"Question", "name":"What is the 'Boost System'?", "acceptedAnswer":{ "@type":"Answer", "text":"The Boost System is our unique promotional feature that allows you to get your listings seen by more people. It works like an auction: by using your $ANIME tokens, you can place a 'boost' on your item. Listings with the highest boosts get the top ranks on our marketplace for 24 hours." } },
                { "@type":"Question", "name":"Is there a tax on buying or selling the $ANIME token?", "acceptedAnswer":{ "@type":"Answer", "text":"No. The $ANIME token contract has a 0% trading tax. This ensures that you get the most out of your trades on decentralized exchanges (DEXs). A 0% tax is also a critical feature that makes our token compatible with major centralized exchanges for potential future listings." } },
                { "@type":"Question", "name":"Do I have to pay taxes on my profits?", "acceptedAnswer":{ "@type":"Answer", "text":"The ANIME Project and its community contributors do not provide financial or tax advice. You are solely responsible for handling your own tax obligations in accordance with the laws of your country. To assist you, the marketplace will provide a feature in your user profile to download a .CSV file of your entire transaction history." } },
                { "@type":"Question", "name":"Who is leading The ANIME Project?", "acceptedAnswer":{ "@type":"Answer", "text":"The ANIME Project is a decentralized movement led by a dedicated, global community of core contributors. Our reputation is built on public, on-chain actions like the burned LP and the transparent Revival Wallet. As the project hits significant milestones, the core contributors are prepared to attach their public profiles to the project to further strengthen trust." } },
                { "@type":"Question", "name":"What slippage should I use when buying?", "acceptedAnswer":{ "@type":"Answer", "text":"Start with a slippage setting of 1-3%. If a transaction fails due to price movement, you may need to increase it slightly and try again." } },
                { "@type":"Question", "name":"I have more questions. Where can I ask?", "acceptedAnswer":{ "@type":"Answer", "text":"Our community is always active and ready to help. The best place to ask questions is in our official Telegram or Discord channels." } }
              ]
            })
          }}
        />

        </section>

      {/* Hidden anchor for backward compatibility */}
      <div id="contact-support-section" className="invisible absolute -mt-20"></div>
      
      <section id="get-in-touch" className="mx-auto mt-16 max-w-5xl text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
        <h2 className="text-2xl md:text-3xl font-bold">
          <span className="text-4xl mr-3 leading-[1.2] align-middle pb-1">💬</span>
          Join the Movement
        </h2>
        <p className="mt-3 text-muted-foreground">Connect with the ANIME.TOKEN Ownership Economy. Don't just be a user—be an owner in the future of decentralized communities.</p>
        <div className="mt-6 space-y-4">
          <div aria-labelledby="join-social">
            <h3 id="join-social" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social</h3>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="glass"><a href="https://x.com/AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiX className="h-4 w-4" aria-hidden="true" />X (Twitter)</a></Button>
              <Button asChild variant="glass"><a href="https://www.instagram.com/animedottoken/" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiInstagram className="h-4 w-4" aria-hidden="true" />Instagram</a></Button>
              <Button asChild variant="glass"><a href="https://www.tiktok.com/@animedottoken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiTiktok className="h-4 w-4" aria-hidden="true" />TikTok</a></Button>
              <Button asChild variant="glass"><a href="https://www.youtube.com/@AnimeDotToken" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiYoutube className="h-4 w-4" aria-hidden="true" />YouTube</a></Button>
              <Button asChild variant="glass"><a href="https://www.facebook.com/anime.token/" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiFacebook className="h-4 w-4" aria-hidden="true" />Facebook</a></Button>
            </div>
          </div>
          <div aria-labelledby="join-community">
            <h3 id="join-community" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community</h3>
            <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="glass"><a href="https://discord.com/invite/HmSJdT5MRX" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiDiscord className="h-4 w-4" aria-hidden="true" />Discord</a></Button>
              <Button asChild variant="glass"><a href="https://t.me/AnimeDotTokenCommunity" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2"><SiTelegram className="h-4 w-4" aria-hidden="true" />Telegram</a></Button>
            </div>
          </div>
        </div>
      </section>


      <footer className="mx-auto mt-16 max-w-5xl border-t pt-6 text-center text-sm text-muted-foreground">
        <p>© 2025 ANIME.TOKEN | All Rights Reserved</p>
        <p className="mt-1 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span>Official Contract:</span>
          <code className="rounded-md bg-secondary px-2 py-0.5 text-xs break-all max-w-xs sm:max-w-sm">
            {CONTRACT}
          </code>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={copyContract} aria-label="Copy contract address">
            <Copy className="h-4 w-4" />
          </Button>
        </p>
        <p className="mt-2">Disclaimer: Investing in cryptocurrency involves risk. This is not financial advice.</p>
        <p className="mt-2">Website created with <a href="https://lovable.dev/invite/f59fc72f-7a4c-44ba-9735-226d9f24e4b0" target="_blank" rel="noopener noreferrer sponsored" className="underline underline-offset-4">Lovable</a>.</p>
      </footer>

      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'ANIME Token',
            url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080',
            sameAs: [
              'https://x.com/AnimeDotToken',
              'https://t.me/AnimeDotTokenCommunity',
              'https://discord.com/invite/HmSJdT5MRX'
            ]
          })
        }}
      />
     </main>
    </ViewModeProvider>
  );
};

export default Index;
