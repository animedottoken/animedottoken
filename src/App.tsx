import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { BottomNav } from "@/components/BottomNav";
import { BackToTop } from "@/components/BackToTop";
import { ScrollToTopOnRoute } from "@/components/ScrollToTopOnRoute";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { ErrorBoundary } from "react-error-boundary";

const queryClient = new QueryClient();

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

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <div className="sticky top-0 z-20 bg-background border-b">
          <TopNav />
        </div>
        <main className="flex-1 overflow-x-hidden">
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BackToTop />
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <SolanaWalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTopOnRoute />
                <AppLayout />
              </BrowserRouter>
            </TooltipProvider>
          </SolanaWalletProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;