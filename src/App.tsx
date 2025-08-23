import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { TopNav } from "@/components/TopNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletContext";
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
import NFTDetail from "./pages/NFTDetail";
import { ErrorBoundary } from "react-error-boundary";

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
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
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
            <Route path="/nft/:id" element={<NFTDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <HelmetProvider>
      <SolanaWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </TooltipProvider>
      </SolanaWalletProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
