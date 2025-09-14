import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense, useMemo, useEffect } from "react";
import { ImageLazyLoad } from "@/components/ImageLazyLoad";
import { useViewMode } from "@/contexts/ViewModeContext";
import ViewModeToggle from "@/components/ViewModeToggle";
import { Link, useLocation } from "react-router-dom";

import { SectionLabel } from "@/components/SectionLabel";
import { Coins, Shield, Share2, Users, ShoppingCart, HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import HeroSection from "@/components/HeroSection";


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
import { ChevronDown, Copy, Share, Handshake, BarChart3 } from "lucide-react";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { CREATOR_WALLET_ADDRESS } from "@/constants/token";

const CONTRACT = "GRkAQsphKwc5PPMmi2bLT2aG9opmnHqJPN7spmjLpump";
const PAIR_ADDRESS = "H5EYz1skuMdwrddHuCfnvSps1Ns3Lhf7WdTQMfdT8Zwc";
const TOTAL_SUPPLY = 974338302;

function Section3({ holders }: { holders: number | null | undefined }) {
  const [section3DetailsOpen, setSection3DetailsOpen] = useState(false);
  const { viewMode } = useViewMode();
  const location = useLocation();

  // Auto-open details when navigating to calculator or chart
  useEffect(() => {
    const hash = location.hash;
    if (hash === "#ownership-calculator" || hash === "#live-daily-price-chart" || hash === "#market-cap-chart") {
      setSection3DetailsOpen(true);
    }
  }, [location.hash]);

  // Set initial state based on view mode
  useEffect(() => {
    setSection3DetailsOpen(viewMode === 'full');
  }, [viewMode]);

  return (
    <section id="ownership-calculator" className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 ownership-calculator scroll-mt-20">
      <SectionLabel icon={Users} title="Ownership Economy" />
      <header className="mb-0 text-left">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-violet-400" />
          The Power of Community: A Decentralized Future
        </h2>
        <p className="text-lg text-muted-foreground">
          Our ecosystem is owned by its community. With a decentralized distribution, even a small stake can represent a significant voice in the project. Use the live calculator below to see how your support translates into a real share of the network.
        </p>
      </header>

      <Collapsible open={section3DetailsOpen} onOpenChange={setSection3DetailsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-4 group font-medium">
          <span>{section3DetailsOpen ? "Hide details" : "Show details"}</span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-6">
          <div className="mb-8">
            <OwnershipCalculator />
          </div>

          <div id="live-daily-price-chart" className="mt-8 market-cap-chart scroll-mt-20">
            <Suspense fallback={<div className="animate-pulse bg-muted/20 rounded-lg h-64"></div>}>
              <MarketCapChart />
            </Suspense>
          </div>

          <div className="mt-8 text-left">
            <p className="text-muted-foreground">
              Join over{" "}
              <span className="font-bold text-foreground">
                {holders ? `${holders.toLocaleString()}` : "1,200"}
              </span>{" "}
              holders and become a key stakeholder in our movement. Your contribution, no matter the size, helps us build a new, decentralized economy on Solana.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>


      {/* Backward compatibility for old market-cap-chart hash */}
      <div id="market-cap-chart" className="scroll-mt-20"></div>
    </section>
  );
}

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
  const congratsImage = `${shareBase}/og/anime-army-share-v22.png?ts=1725292860`;
  const sharePageUrl = `${shareBase}/share-army-v22.html`;
  const shareImage = congratsImage;
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
  const [step1Open, setStep1Open] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [step3Open, setStep3Open] = useState(false);
  const [step4Open, setStep4Open] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  
  const { viewMode } = useViewMode();
  
  // Set all collapsible states based on view mode
  useEffect(() => {
    if (viewMode === 'full') {
      setBuyOpen(true);
      setStep1Open(true);
      setStep2Open(true);
      setStep3Open(true);
      setStep4Open(true);
      setFaqOpen(true);
    } else {
      setBuyOpen(false);
      setStep1Open(false);
      setStep2Open(false);
      setStep3Open(false);
      setStep4Open(false);
      setFaqOpen(false);
    }
  }, [viewMode]);
  

  return (
    
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
        
        <link
          rel="preload"
          as="image"
          href="/lovable-uploads/35f96dc8-741f-4cfa-8d07-d0019a55a758.png"
        />
        <link
          rel="preload"
          as="image"
          href="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png"
          
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
            <div className="flex items-center gap-3 ml-auto">
              <ViewModeToggle />
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="View mode help"
                    title="Learn about different view modes"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">View Modes</h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Overview:</strong> Shows only headlines and subheadlines. Click "Show details" to expand sections.
                      </div>
                      <div>
                        <strong>Full Details:</strong> Expands all sections to show complete information.
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </div>
      </div>

      <div id="hero" className="scroll-mt-20">
        <HeroSection />
      </div>

      {/* 2. PRODUCT SECTION - NFT Minting & Marketplace */}
      <div className="scroll-mt-20">
        <NFTPreviewSection />
      </div>

      {/* 3. PHILOSOPHY SECTION - Ownership Economy + Live Calculator */}
      <Section3 holders={holders} />

      {/* 4. PROOF SECTION - Trust & Security */}
      <div id="trust-security-section" className="trust-security-section scroll-mt-20">
        <TrustSecuritySection tokenAddress={CONTRACT} creatorWalletUrl={`https://solscan.io/account/${CREATOR_WALLET_ADDRESS}#portfolio`} />
      </div>

      {/* 5. COMMUNITY SECTION - ANIME ARMY */}
      <div id="anime-token-army" className="scroll-mt-20">
        <NFTSupporterSection />
      </div>

      {/* 6. SOCIAL PROOF & FINAL CTA */}
      <div id="featured-community-content" className="featured-community-content scroll-mt-20">
        <Suspense fallback={<div className="animate-pulse bg-muted/20 rounded-lg min-h-[420px]"></div>}>
          <FeaturedCommunityContent />
        </Suspense>
      </div>


      <section id="how-to-buy" className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
        <SectionLabel icon={ShoppingCart} title="How to Buy ANIME" />
        <h2 className="text-left text-4xl font-bold flex items-center gap-3 mb-4">
          <ShoppingCart className="w-10 h-10 text-violet-400" />
          How to Join the Ownership Economy: Buying $ANIME
        </h2>
        <p className="mt-3 text-left text-muted-foreground">Getting $ANIME and becoming a stakeholder in the Ownership Economy is easier than ever. Follow these 4 simple steps:</p>
        
        <Collapsible open={buyOpen} onOpenChange={setBuyOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-4 group font-medium">
            <span>{buyOpen ? "Hide details" : "Show details"}</span>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-6">
            <ul className="space-y-5 list-none pl-0">
          <li>
            <Collapsible open={step1Open} onOpenChange={setStep1Open}>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Step 1: Get a Digital Wallet App</span>
                 <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group font-medium">
                   {step1Open ? "Hide details" : "Show details"}
                   <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step1Open ? "rotate-180" : ""}`} />
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
                 <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group font-medium">
                   {step2Open ? "Hide details" : "Show details"}
                   <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step2Open ? "rotate-180" : ""}`} />
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
                 <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group font-medium">
                   {step3Open ? "Hide details" : "Show details"}
                   <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step3Open ? "rotate-180" : ""}`} />
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
                 <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group font-medium">
                   {step4Open ? "Hide details" : "Show details"}
                   <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${step4Open ? "rotate-180" : ""}`} />
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

            <div className="mt-8 text-left">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Handshake className="w-8 h-8 text-primary" />
                Congratulations, Stakeholder!
              </h2>
              <div className="mt-4 max-w-3xl overflow-hidden rounded-xl border bg-card shadow-glow">
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

          </CollapsibleContent>
        </Collapsible>
      </section>

      <section id="faq-section" className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20" key="faq-section">
        <SectionLabel icon={HelpCircle} title="FAQ" />
        <h2 className="text-left text-4xl font-bold flex items-center gap-3 mb-4">
          <HelpCircle className="w-10 h-10 text-violet-400" />
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="mt-3 text-left text-muted-foreground">Your key questions about the ANIME.TOKEN project and the Ownership Economy, answered.</p>
        
        <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
           <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mt-4 group font-medium">
             <span>{faqOpen ? "Hide details" : "Show details"}</span>
             <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
           </CollapsibleTrigger>

          <CollapsibleContent className="mt-6">
            <ul className="space-y-4 list-none pl-0">
              <li className="rounded-md border bg-card/50 p-4">
                <span className="text-base md:text-lg font-semibold">What is the official $ANIME contract address?</span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="rounded-md bg-secondary px-2 py-1 text-xs sm:text-sm break-all w-full block">{CONTRACT}</code>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" onClick={copyContract}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">I can't find $ANIME in my wallet's swap search. What do I do?</span>
                  <p className="mt-2 text-muted-foreground">Some wallet apps may not list new tokens immediately. To find it, simply copy the official contract address above and paste it directly into the token selection field in your wallet's swap interface.</p>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What is the utility of the $ANIME token?</span>
                  <p className="mt-2 text-muted-foreground">$ANIME is the official utility token of our community-owned ecosystem, designed to unlock value and empower our stakeholders. The token's utility will expand as the project grows.</p>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">Utility at Launch:</p>
                      <p className="mt-1 text-muted-foreground">The primary utility at launch is for our Listing Promotion (Boost System). You can use your $ANIME tokens to boost your NFT listings, giving them greater visibility on the marketplace.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Future Utility (On the Roadmap):</p>
                      <ul className="mt-1 ml-4 list-disc text-muted-foreground space-y-1">
                        <li><strong>Staking for Rewards & Benefits:</strong> We are developing a staking system that will allow you to earn significant discounts on marketplace fees and achieve "Staked Creator" status.</li>
                        <li><strong>Community Governance:</strong> As the ecosystem matures, the token will grant you the right to vote on key project decisions, giving you a real voice in the platform's future.</li>
                      </ul>
                    </div>
                  </div>
                </li>
                <li className="rounded-md border bg-card/50 p-4">
                  <span className="text-base md:text-lg font-semibold">What are the fees for selling on the ANIME Marketplace?</span>
                  <p className="mt-2 text-muted-foreground">We believe in transparency. A small, flat fee of 2% is applied to every successful sale on the marketplace. This fee is crucial for the project's sustainability and is reinvested directly into funding development, marketing initiatives, and community rewards.</p>
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

      {/* Hidden anchor for backward compatibility */}
      <div id="contact-support-section" className="invisible absolute -mt-20"></div>
      
      <section id="get-in-touch" className="mx-auto mt-16 max-w-5xl px-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 scroll-mt-20">
        <SectionLabel icon={Share2} title="Get in Touch" />
        <h2 className="text-left text-4xl font-bold flex items-center gap-3 mb-4">
          <Users className="w-10 h-10 text-violet-400" />
          Join the Movement
        </h2>
        <p className="mt-3 text-left text-muted-foreground">Connect with the ANIME.TOKEN Ownership Economy. Don't just be a user—be an owner in the future of decentralized communities.</p>
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
    
  );
};

export default Index;
