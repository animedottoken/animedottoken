import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Sparkles, ArrowRight } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { LiveStatsCounter } from '@/components/LiveStatsCounter';
import { Link } from 'react-router-dom';

const HeroGraphic: React.FC = () => {
  const nftImages = [
    { src: "/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png", alt: "ANIME Token logo", className: "absolute top-4 right-4 w-16 h-16 animate-pulse" },
    { src: "/assets/nft-ai-portrait-alt.jpg", alt: "AI Portrait NFT", className: "absolute top-16 left-8 w-20 h-20 rounded-lg shadow-lg rotate-12" },
    { src: "/assets/nft-pixel-warrior.jpg", alt: "Pixel Warrior NFT", className: "absolute bottom-20 right-12 w-24 h-24 rounded-lg shadow-xl -rotate-6" },
    { src: "/assets/nft-dragon-spirit.jpg", alt: "Dragon Spirit NFT", className: "absolute bottom-8 left-4 w-18 h-18 rounded-lg shadow-lg rotate-3" },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {nftImages.map((img, index) => (
        <picture key={index}>
          <img
            src={img.src}
            alt={img.alt}
            className={`${img.className} opacity-80 hover:opacity-100 transition-all duration-300 hover:scale-110`}
            loading="lazy"
          />
        </picture>
      ))}
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/20 to-background/60" />
    </div>
  );
};

const HeroSection: React.FC = () => {
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <>
      <header className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-card shadow-glow">
        <AspectRatio ratio={3 / 2}>
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-background animate-pulse">
            <picture>
              <source srcSet="/lovable-uploads/35f96dc8-741f-4cfa-8d07-d0019a55a758.png" type="image/png" />
              <img
                src="/images/og-anime.jpg"
                alt="ANIME.TOKEN hero banner showcasing the ownership economy platform"
                className="w-full h-full object-cover block transition-opacity duration-500"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                onLoad={(e) => {
                  const container = e.currentTarget.parentElement?.parentElement;
                  if (container) container.classList.remove('animate-pulse');
                  e.currentTarget.style.opacity = '1';
                }}
                style={{ opacity: 0 }}
              />
            </picture>
          </div>
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
          
          {/* Content Overlay */}
          <div className="relative z-10 h-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" 
                  alt="ANIME Token hexagon logo" 
                  className="h-12 w-12 md:h-16 md:w-16" 
                  loading="eager" 
                  decoding="sync"
                  fetchPriority="high"
                />
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold leading-tight text-foreground">
                    Ownership Economy
                  </h1>
                  <p className="text-lg md:text-xl font-semibold text-primary">
                    on Solana
                  </p>
                </div>
              </div>
              
              <p className="text-sm md:text-base text-muted-foreground max-w-md">
                Don't just be a user—be an owner. Mint, trade, and collect on a transparent, community-owned ecosystem.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="group">
                  <Link to="/mint">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Minting
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/marketplace">
                    Explore Marketplace
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right Graphic - Hidden on small screens */}
            <div className="hidden lg:block">
              <HeroGraphic />
            </div>
          </div>
        </AspectRatio>
      </header>
      
      <div className="mx-auto max-w-5xl px-6 mt-6 md:mt-8 text-left">
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group font-medium">
              <span>{statsOpen ? "Hide live stats" : "Show live stats"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <LiveStatsCounter />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </>
  );
};

export default HeroSection;