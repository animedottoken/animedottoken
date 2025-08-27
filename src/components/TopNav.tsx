import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
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
          {/* Menu dropdown with navigation + wallet */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                <span className="text-sm font-medium">Menu</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-popover text-popover-foreground border border-border shadow-lg z-[9999]"
              sideOffset={5}
            >
              {/* Navigation Items */}
              <DropdownMenuItem onClick={() => navigate('/mint')} className="flex items-center gap-2 cursor-pointer">
                <Coins className="h-4 w-4" />
                <span>Mint NFTs</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/marketplace')} className="flex items-center gap-2 cursor-pointer">
                <ShoppingCart className="h-4 w-4" />
                <span>Marketplace</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Wallet Section */}
              <div className="px-2 py-1.5">
                <div className="text-xs font-medium text-muted-foreground mb-1">Wallet</div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Wallet className="h-4 w-4" />
                  <span>{connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {!connected && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      connect();
                    }}
                    className="w-full mt-1 h-8 text-xs"
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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

              {/* Navigation Routes */}
              <div className="space-y-1 mb-6">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">Navigation</div>
                {navigationItems.filter((item): item is RouteItem => item.type === "route").map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={(e) => handleNavigation(item, e)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Button>
                ))}
              </div>

              {/* Wallet Section */}
              <div className="border-t pt-4">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">Wallet</div>
                <div className="flex items-center gap-2 px-2 py-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Wallet className="h-4 w-4" />
                  <span>{connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {!connected && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => connect()}
                    className="w-full mx-2 h-10"
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>

              {/* Home Sections */}
              <div className="space-y-1 border-t pt-4">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">Home Sections</div>
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
    </header>
  );
};