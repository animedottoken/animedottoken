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
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { RequireAuth } from "@/components/RequireAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ShareNFT from "./pages/ShareNFT";
import Mint from "./pages/Mint";
import MintCollection from "./pages/MintCollection";
import MintNFT from "./pages/MintNFT";
import CollectionDetail from "./pages/CollectionDetail";
import Marketplace from "./pages/Marketplace";
import Profile from "./pages/Profile";
import CreatorProfile from "./pages/CreatorProfile";
import NFTDetail from "./pages/NFTDetail";
import Auth from "./pages/Auth";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import Trust from "./pages/Trust";
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

  // Route diagnostics - log path changes to help debug navigation issues
  useEffect(() => {
    console.log(`🗺️ Route changed to: ${location.pathname}${location.search}${location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  // Global magic link handler for root path redirects
  useEffect(() => {
    const handleRootMagicLink = async () => {
      // Only process if we're on root path and have auth tokens/codes
      if (location.pathname === '/' && (location.hash.includes('access_token') || location.search.includes('code='))) {
        console.log('Processing auth tokens from root path...');
        
        try {
          // Parse redirect target from query params
          const searchParams = new URLSearchParams(location.search);
          const rawRedirect = searchParams.get('redirect');
          const safeRedirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/profile';
          
          // Handle Magic Link tokens in hash fragment
          if (location.hash.includes('access_token')) {
            console.log('Processing magic link tokens from hash...');
            const hashParams = new URLSearchParams(location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (error) {
                console.error('Root magic link error:', error);
                navigate('/auth');
                return;
              }
              
              if (data.session) {
                console.log('Root magic link successful, session created');
                // Clean URL and navigate to redirect target
                window.history.replaceState({}, document.title, '/');
                navigate(safeRedirect, { replace: true });
              }
            }
          }
          
          // Handle OAuth code exchange for query params
          if (location.search.includes('code=')) {
            console.log('Processing OAuth code from root...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            
            if (error) {
              console.error('Root OAuth error:', error);
              navigate('/auth');
              return;
            }
            
            if (data.session) {
              console.log('Root OAuth successful, session created');
              // Clean URL and navigate to redirect target
              window.history.replaceState({}, document.title, '/');
              navigate(safeRedirect, { replace: true });
            }
          }
        } catch (error) {
          console.error('Root auth processing failed:', error);
          navigate('/auth');
        }
      }
    };

    handleRootMagicLink();
  }, [location, navigate]);

  // Auto-open wallet selector if wallet-connect parameter is present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('wallet-connect') === '1') {
      console.log('🎯 Auto-opening wallet selector from URL parameter');
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
      <div className="min-h-screen flex flex-col w-full">
        <SecurityBanner />
        <div className="px-4 pt-2">
          <BetaBanner />
        </div>
        <div className="sticky top-0 z-20 bg-background border-b">
          <TopNav />
        </div>
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/share/nft/:nftId" element={<ShareNFT />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/mint/collection" element={<MintCollection />} />
            <Route path="/mint/nft" element={<MintNFT />} />
            <Route path="/collection/:collectionId" element={<CollectionDetail />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:wallet" element={<CreatorProfile />} />
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="/auth" element={<Auth />} />
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
    <div className="min-h-screen w-full">
      <SecurityBanner />
      <div className="px-4 pt-2">
        <BetaBanner />
      </div>
      <DesktopSidebar
        className="fixed left-0 top-0 h-screen z-30" 
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="sticky top-0 z-20 bg-background border-b">
          <TopNav />
        </div>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/share/nft/:nftId" element={<ShareNFT />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/mint/collection" element={<MintCollection />} />
            <Route path="/mint/nft" element={<MintNFT />} />
            <Route path="/collection/:collectionId" element={<CollectionDetail />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:wallet" element={<CreatorProfile />} />
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="/auth" element={<Auth />} />
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
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <BrowserRouter>
            <EnvironmentProvider>
              <AuthProvider>
                <ViewModeProvider>
                  <SolanaWalletProvider>
                  <ProfileFiltersProvider>
                  <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <ScrollToTopOnRoute />
                  <AppLayout />
                  </TooltipProvider>
                  </ProfileFiltersProvider>
                  </SolanaWalletProvider>
                </ViewModeProvider>
              </AuthProvider>
            </EnvironmentProvider>
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;