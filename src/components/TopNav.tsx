import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, Wallet, ChevronDown, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { useIsMobile } from "@/hooks/use-mobile";
import { useSolanaWallet } from "@/contexts/MockSolanaWalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { StatusDots } from "@/components/StatusDots";

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
  
  // Home sections - matching actual IDs and classes on the page
  { type: "section", title: "Community Showcase", icon: Users, hash: "featured-community-content" },
  { type: "section", title: "Trust & Security", icon: Shield, hash: "trust-security-section" },
  { type: "section", title: "Ownership Calculator", icon: FileText, hash: "ownership-calculator" },
  { type: "section", title: "Market Chart", icon: Target, hash: "market-cap-chart" },
  { type: "section", title: "How to Buy ANIME", icon: ShoppingCart, hash: "how-to-buy" },
  { type: "section", title: "FAQ", icon: Star, hash: "faq-section" },
  { type: "section", title: "ANIME ARMY", icon: Trophy, hash: "nft-supporter-section" },
  { type: "section", title: "Create NFTs", icon: Coins, hash: "create-nfts" },
];

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { connected, connecting, connect, disconnect } = useSolanaWallet();

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

  const handleProfileAction = () => {
    setOpen(false);
    if (user) {
      navigate('/profile');
    } else {
      navigate('/auth?redirect=' + encodeURIComponent(location.pathname));
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
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
          {/* Show email on desktop when signed in */}
          {user?.email && (
            <span className="text-sm text-muted-foreground max-w-32 truncate">
              {user.email}
            </span>
          )}
          
          {/* Menu dropdown with navigation + wallet */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <StatusDots isLoggedIn={!!user} isWalletConnected={connected} className="mr-1" />
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
              <DropdownMenuItem onClick={() => navigate('/mint')} className="flex items-center gap-2 cursor-pointer py-3 px-3">
                <Coins className="h-4 w-4" />
                <span>Mint NFTs</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/marketplace')} className="flex items-center gap-2 cursor-pointer py-3 px-3">
                <ShoppingCart className="h-4 w-4" />
                <span>Marketplace</span>
              </DropdownMenuItem>
              
              {/* Unified Profile/Auth Row */}
              <DropdownMenuItem onClick={handleProfileAction} className="flex items-center justify-between cursor-pointer py-3 px-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </div>
                {user ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="h-6 px-2 py-1 text-xs hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Sign out
                  </Button>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LogIn className="h-3 w-3" />
                    Sign in
                  </div>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Wallet Section */}
              <div className="px-2 py-1.5">
                <div 
                  className="flex items-center gap-2 cursor-pointer py-3 px-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connected) {
                      disconnect();
                    } else {
                      connect();
                    }
                  }}
                >
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm">{connected ? 'Disconnect Wallet' : 'Connect Wallet'}</span>
                </div>
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
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8 relative">
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                <StatusDots isLoggedIn={!!user} isWalletConnected={connected} size="sm" />
              </div>
              <Menu className="h-4 w-4" />
              <span className="sr-only">Navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:w-80 max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-center gap-2 px-2 mb-6">
                <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-10 w-10" />
                <div>
                  <h2 className="font-bold text-lg">ANIME.TOKEN</h2>
                </div>
              </div>

              {/* Navigation Routes */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => navigate('/mint')}
                >
                  <Coins className="h-5 w-5" />
                  <span className="font-medium">Mint NFTs</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => navigate('/marketplace')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">Marketplace</span>
                </Button>
                
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
      <nav className="flex items-center">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <StatusDots isLoggedIn={!!user} isWalletConnected={connected} className="mr-1" />
              <span className="text-sm font-medium">Menu</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-popover text-popover-foreground border border-border shadow-lg z-[9999]"
            sideOffset={5}
          >
            <DropdownMenuItem onClick={() => navigate('/mint')} className="flex items-center gap-2 cursor-pointer py-3 px-3">
              <Coins className="h-4 w-4" />
              <span>Mint NFTs</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/marketplace')} className="flex items-center gap-2 cursor-pointer py-3 px-3">
              <ShoppingCart className="h-4 w-4" />
              <span>Marketplace</span>
            </DropdownMenuItem>
            
            {/* Unified Profile/Auth Row */}
            <DropdownMenuItem onClick={handleProfileAction} className="flex items-center justify-between cursor-pointer py-3 px-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </div>
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-6 px-2 py-1 text-xs hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LogIn className="h-3 w-3" />
                  Sign in
                </div>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <div className="px-2 py-1.5">
              <div 
                className="flex items-center gap-2 cursor-pointer py-3 px-2 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (connected) {
                    disconnect();
                  } else {
                    connect();
                  }
                }}
              >
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <Wallet className="h-4 w-4" />
                <span className="text-sm">{connected ? 'Disconnect Wallet' : 'Connect Wallet'}</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
};