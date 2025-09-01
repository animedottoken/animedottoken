import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { LiveStatsCounter } from '@/components/LiveStatsCounter';
import { useViewMode } from '@/contexts/ViewModeContext';

const HeroSection: React.FC = () => {
  const { viewMode } = useViewMode();
  const isOverview = viewMode === 'overview';

  return (
    <>
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
      
      <div className={`mx-auto max-w-5xl px-6 mt-6 md:mt-8 ${isOverview ? 'text-left' : 'text-center'}`}>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className={`flex items-center gap-3 ${isOverview ? 'justify-start' : 'justify-center'}`}>
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
          <p className={`mt-3 md:mt-4 text-muted-foreground md:text-lg max-w-4xl ${isOverview ? '' : 'mx-auto'}`}>
            Mint, trade, and collect on a transparent, community-owned ecosystem. Don't just be a user—be an owner.
          </p>
          
          {!isOverview && <LiveStatsCounter />}
        </div>
      </div>
    </>
  );
};

export default HeroSection;