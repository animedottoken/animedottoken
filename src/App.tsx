import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { BottomNav } from "@/components/BottomNav";
import { BackToTop } from "@/components/BackToTop";
import { ScrollToTopOnRoute } from "@/components/ScrollToTopOnRoute";
import { SolanaWalletProvider } from "@/contexts/MockSolanaWalletContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ShareNFT from "./pages/ShareNFT";
import Mint from "./pages/Mint";
import MintCollection from "./pages/MintCollection";
import MintNFT from "./pages/MintNFT";
import CollectionDetail from "./pages/CollectionDetail";
import Marketplace from "./pages/Marketplace";
import CreatorProfile from "./pages/CreatorProfile";
import NFTDetail from "./pages/NFTDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Trust from "./pages/Trust";
import Staking from "./pages/Staking";
import { ErrorBoundary } from "react-error-boundary";
import { ProfileFiltersProvider } from "@/contexts/ProfileFiltersContext";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";
import { SecurityBanner } from "@/components/SecurityBanner";
import { BetaBanner } from "@/components/BetaBanner";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openWalletSelector } = useSolanaWallet();

  // Route diagnostics
  useEffect(() => {
    console.log(`🗺️ Route changed to: ${location.pathname}`);
  }, [location.pathname]);

  // Auto-open wallet modal if openWalletModal parameter is present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const intent = searchParams.get('intent');
    
    if (searchParams.get('openWalletModal') === '1') {
      console.log('🎯 Auto-opening wallet modal from URL parameter', { intent });
      
      // Clean URL first
      searchParams.delete('openWalletModal');
      searchParams.delete('intent');
      const newUrl = searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Store intent in sessionStorage for components to use
      if (intent) {
        sessionStorage.setItem('wallet-intent', intent);
      }
      
      // Open wallet selector after a brief delay
      setTimeout(() => {
        openWalletSelector();
      }, 500);
    }
  }, [location.search, location.pathname, openWalletSelector]);

  // Legacy support for wallet-connect parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('wallet-connect') === '1') {
      console.log('🎯 Auto-opening wallet selector from legacy parameter');
      // Clean URL first
      searchParams.delete('wallet-connect');
      const newUrl = searchParams.toString() ? `${location.pathname}?${searchParams.toString()}` : location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Open wallet selector after a brief delay
      setTimeout(() => {
        openWalletSelector();
      }, 500);
    }
  }, [location.search, location.pathname, openWalletSelector]);

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full" style={{ paddingTop: 'var(--header-total-height, 120px)' }}>
        <TopNav />
        <SecurityBanner />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/share/nft/:nftId" element={<ShareNFT />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/mint/collection" element={<MintCollection />} />
            <Route path="/mint/nft" element={<MintNFT />} />
            <Route path="/collection/:collectionId" element={<CollectionDetail />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/profile/:wallet" element={<CreatorProfile />} />
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/trust" element={<Trust />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
        <BackToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ paddingTop: 'var(--header-total-height, 120px)' }}>
      <TopNav />
      <SecurityBanner />
      <DesktopSidebar
        className="fixed left-0 z-30" 
        style={{ 
          top: 'var(--header-total-height, 120px)', 
          height: 'calc(100vh - var(--header-total-height, 120px))' 
        }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/share/nft/:nftId" element={<ShareNFT />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/mint/collection" element={<MintCollection />} />
            <Route path="/mint/nft" element={<MintNFT />} />
            <Route path="/collection/:collectionId" element={<CollectionDetail />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/profile/:wallet" element={<CreatorProfile />} />
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/trust" element={<Trust />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BackToTop />
      </div>
    </div>
  );
};

const App = () => {
  const queryClient = new QueryClient();
  
  // Measure and set header heights dynamically with ResizeObserver
  useEffect(() => {
    const updateHeaderHeights = () => {
      const betaBanner = document.querySelector('[role="banner"]') as HTMLElement;
      const betaHeight = betaBanner?.offsetHeight || 64;
      const topNavHeight = 56; // Fixed height from h-14
      
      document.documentElement.style.setProperty('--beta-banner-height', `${betaHeight}px`);
      document.documentElement.style.setProperty('--top-nav-height', `${topNavHeight}px`);
      document.documentElement.style.setProperty('--header-total-height', `${betaHeight + topNavHeight}px`);
    };

    // Wait for fonts to load before measuring
    document.fonts.ready.then(() => {
      updateHeaderHeights();
      
      // Set up ResizeObserver for more accurate tracking
      const betaBanner = document.querySelector('[role="banner"]') as HTMLElement;
      if (betaBanner) {
        const resizeObserver = new ResizeObserver(() => {
          updateHeaderHeights();
        });
        resizeObserver.observe(betaBanner);
        
        // Cleanup function
        return () => {
          resizeObserver.disconnect();
        };
      }
    });

    // Fallback resize listener
    window.addEventListener('resize', updateHeaderHeights);
    
    return () => window.removeEventListener('resize', updateHeaderHeights);
  }, []);
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <BrowserRouter>
            <EnvironmentProvider>
              <ViewModeProvider>
                <SolanaWalletProvider>
                <ProfileFiltersProvider>
                <TooltipProvider>
                <BetaBanner />
                <Toaster />
                <Sonner />
                <ScrollToTopOnRoute />
                <AppLayout />
                </TooltipProvider>
                </ProfileFiltersProvider>
                </SolanaWalletProvider>
              </ViewModeProvider>
            </EnvironmentProvider>
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;