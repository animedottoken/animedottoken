import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, LogOut, LogIn, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { useAuth } from "@/contexts/AuthContext";

type RouteItem = {
  type: "route";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
};

type SectionItem = {
  type: "section";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hash: string;
};

type NavigationItem = RouteItem | SectionItem;

const navigationItems: NavigationItem[] = [
  // Main routes
  { type: "route", title: "Mint NFTs", icon: Coins, path: "/mint" },
  { type: "route", title: "Marketplace", icon: ShoppingCart, path: "/marketplace" },
  { type: "route", title: "Profile", icon: User, path: "/profile" },
  
  // Home sections - matching actual IDs and classes on the page
  { type: "section", title: "Community Showcase", icon: Users, hash: "featured-community-content" },
  { type: "section", title: "Trust & Security", icon: Shield, hash: "trust-security-section" },
  { type: "section", title: "Ownership Calculator", icon: FileText, hash: "ownership-calculator" },
  { type: "section", title: "Market Chart", icon: Target, hash: "market-cap-chart" },
  { type: "section", title: "How to Buy ANIME", icon: ShoppingCart, hash: "how-to-buy" },
  { type: "section", title: "FAQ", icon: Star, hash: "faq-section" },
  { type: "section", title: "ANIME ARMY", icon: Trophy, hash: "nft-supporter-section" },
  { type: "section", title: "Create NFTs", icon: Coins, hash: "create-nfts" },
  { type: "section", title: "Share & Promote", icon: Target, hash: "share-promote-section" },
];

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { connected, connecting, connect } = useSolanaWallet();

  const handleHomeNavigation = () => {
    if (location.pathname === "/") {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      navigate("/");
    }
  };

  const handleNavigation = (item: NavigationItem, e?: React.MouseEvent) => {
    if (item.type === 'route') {
      setOpen(false);
      navigate(item.path);
      return;
    }

    // Native anchor behavior for sections
    setOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${item.hash}`);
    } else {
      window.location.hash = `#${item.hash}`;
    }
  };
  const isActive = (item: NavigationItem) => {
    if (item.type === "route") {
      return location.pathname === item.path;
    }
    return false;
  };

  // For tablet and desktop, show top navigation
  if (!isMobile) {
    return (
      <header className="h-14 flex items-center justify-between border-b pl-4 pr-6 md:pr-8 bg-background/95 backdrop-blur-sm">
        <Link 
          to="/"
          onClick={(e) => {
            // Only handle smooth scroll for unmodified left clicks
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              handleHomeNavigation();
            }
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
          <span className="font-bold text-lg">ANIME.TOKEN</span>
        </Link>
        <nav className="flex items-center gap-3">
          {/* Always visible wallet status */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => connected ? null : connect()}
            className={`flex items-center gap-2 ${connected ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}
          >
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">
              {connecting ? 'Connecting...' : connected ? 'Connected' : 'Connect Wallet'}
            </span>
          </Button>
          
          {/* Single authentication button */}
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span className="text-sm font-medium">Sign In</span>
            </Button>
          )}
        </nav>
      </header>
    );
  }

  // Mobile view - hamburger menu in left corner, same options as desktop
  return (
    <header className="h-14 flex items-center justify-between border-b px-4 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {/* Hamburger menu in far left corner */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:w-80">
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-center gap-2 px-2 mb-6">
                <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-10 w-10" />
                <div>
                  <h2 className="font-bold text-lg">ANIME.TOKEN</h2>
                </div>
              </div>

              {/* Home Sections - same as desktop sidebar */}
              <div className="space-y-1">
                {navigationItems.filter((item): item is SectionItem => item.type === "section").map((item) => (
                  <Button
                    key={item.hash}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={(e) => handleNavigation(item, e)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                    
                  </Button>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <Link 
          to="/"
          onClick={(e) => {
            // Only handle smooth scroll for unmodified left clicks
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              handleHomeNavigation();
            }
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
        </Link>
      </div>
      
      <nav className="flex items-center gap-2">
        {/* Always visible wallet status (mobile) */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => connected ? null : connect()}
          className={`flex items-center gap-1 ${connected ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}
        >
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <Wallet className="h-4 w-4" />
        </Button>
        
        {/* Single authentication button */}
        {user ? (
          <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-1">
            <LogOut className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={() => navigate('/auth')} className="flex items-center gap-1">
            <LogIn className="h-4 w-4" />
          </Button>
        )}
      </nav>
    </header>
  );
};