import { useState, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, ChevronRight, ChevronDown, Wallet, LogOut, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSolanaWallet } from "@/contexts/SolanaWalletContext";
import { toast } from "sonner";

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
  
  // Home sections - matching actual IDs on the page
  { type: "section", title: "Community Showcase", icon: Users, hash: "featured-community-content" },
  { type: "section", title: "Trust & Security", icon: Shield, hash: "trust-security-section" },
  { type: "section", title: "Ownership Calculator", icon: FileText, hash: "ownership-calculator" },
  { type: "section", title: "Market Chart", icon: Target, hash: "market-cap-chart" },
  { type: "section", title: "How to Buy ANIME", icon: ShoppingCart, hash: "how-to-buy" },
  { type: "section", title: "FAQ", icon: FileText, hash: "faq-section" },
  { type: "section", title: "ANIME ARMY", icon: Trophy, hash: "nft-supporter-section" },
  { type: "section", title: "Share & Promote", icon: Target, hash: "share-promote-section" },
];

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, connecting, publicKey, connect, connectWith, disconnect, listProviders } = useSolanaWallet();
  const providers = listProviders();

  const handleHomeNavigation = () => {
    if (location.pathname === "/") {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home page
      navigate("/");
    }
  };

  const handleNavigation = (item: NavigationItem) => {
    if (item.type === "route") {
      setOpen(false);
      navigate(item.path);
    } else {
      // Section navigation: if not on home, navigate with hash so Index scrolls
      if (location.pathname !== "/") {
        setOpen(false);
        navigate(`/#${item.hash}`);
        return;
      }
      // Already on home: smooth-scroll and update hash
      const element = document.getElementById(item.hash) || document.querySelector(`.${item.hash}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(null, '', `#${item.hash}`);
      }
      setOpen(false);
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
      <header className="h-14 flex items-center justify-between border-b px-4 bg-background/95 backdrop-blur-sm">
        <button 
          onClick={handleHomeNavigation}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
        >
          <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
          <span className="font-bold text-lg">ANIME.TOKEN</span>
        </button>
        <nav className="flex items-center gap-1">
          {/* Always show wallet dropdown with navigation */}
          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-green-500/20 bg-green-500/10 hover:bg-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Wallet Connected
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                    <span className="font-mono text-sm text-foreground flex-1">
                      {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-muted"
                      onClick={async () => {
                        if (publicKey) {
                          await navigator.clipboard.writeText(publicKey);
                          toast.success("Wallet address copied!");
                        }
                      }}
                      title="Copy wallet address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* Switch Wallet Section */}
                {providers.length > 1 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      Switch Wallet
                    </div>
                    {providers.map((provider) => (
                      <DropdownMenuItem 
                        key={provider.id}
                        onClick={() => connectWith(provider.id)}
                        className="cursor-pointer flex items-center gap-3"
                      >
                        <Wallet className="h-4 w-4" />
                        <span>{provider.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Main Navigation Items */}
                {navigationItems.filter((item): item is RouteItem => item.type === "route").map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link 
                      to={item.path} 
                      className={`cursor-pointer ${isActive(item) ? 'bg-secondary' : ''}`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 border-red-500/20 bg-red-500/10 hover:bg-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm">
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Wallet Disconnected
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* Main Navigation Items */}
                {navigationItems.filter((item): item is RouteItem => item.type === "route").map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link 
                      to={item.path} 
                      className={`cursor-pointer ${isActive(item) ? 'bg-secondary' : ''}`}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => connect()}
                  disabled={connecting}
                  className="cursor-pointer text-green-600"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </header>
    );
  }

  // Mobile view with hamburger menu
  return (
    <header className="h-14 flex items-center justify-between border-b px-4 bg-background/95 backdrop-blur-sm">
      <button 
        onClick={handleHomeNavigation}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none"
      >
        <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
        <span className="font-bold text-lg">ANIME.TOKEN</span>
      </button>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80">
          <div className="flex flex-col gap-4 mt-8">
            <button 
              onClick={handleHomeNavigation}
              className="flex items-center gap-2 px-2 mb-6 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none text-left"
            >
              <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-10 w-10" />
              <div>
                <h2 className="font-bold text-lg">ANIME.TOKEN</h2>
                <p className="text-sm text-muted-foreground">Navigation Menu</p>
              </div>
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Main Pages</h3>
              {navigationItems.filter((item): item is RouteItem => item.type === "route").map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item) ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-12"
                  asChild
                >
                  <Link to={item.path} onClick={() => handleNavigation(item)}>
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </Button>
              ))}
            </div>

            <div className="space-y-1 mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Home Sections</h3>
              {navigationItems.filter((item): item is SectionItem => item.type === "section").map((item) => (
                <Button
                  key={item.hash}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleNavigation(item)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              ))}
            </div>

            {/* Wallet Status in Mobile Menu */}
            <div className="space-y-2 mt-8 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Wallet</h3>
              {connected ? (
                <div className="px-2 space-y-2">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Wallet Connected
                  </div>
                  <div className="font-mono text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to="/profile" onClick={() => setOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        disconnect();
                        setOpen(false);
                      }}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      connect();
                      setOpen(false);
                    }}
                    disabled={connecting}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};