import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Home, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

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
  { type: "section", title: "FAQ", icon: Star, hash: "faq-section" },
  { type: "section", title: "ANIME ARMY", icon: Trophy, hash: "nft-supporter-section" },
  { type: "section", title: "Share & Promote", icon: Target, hash: "share-promote-section" },
];

export const TopNav = () => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleNavigation = (item: NavigationItem) => {
    if (item.type === "route") {
      setOpen(false);
    } else {
      // Section navigation
      const element = document.getElementById(item.hash) || document.querySelector(`.${item.hash}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
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
        <div></div>
        <nav className="flex items-center gap-1">
          {navigationItems.filter((item): item is RouteItem => item.type === "route").map((item) => (
            <Button
              key={item.path}
              variant={isActive(item) ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to={item.path} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </header>
    );
  }

  // Mobile view with hamburger menu
  return (
    <header className="h-14 flex items-center justify-between border-b px-4 bg-background/95 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" alt="ANIME Token" className="h-8 w-8" />
        <span className="font-bold text-lg">ANIME.TOKEN</span>
      </Link>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 sm:w-80">
          <div className="flex flex-col gap-4 mt-8">
            <Link to="/" className="flex items-center gap-2 px-2 mb-6 hover:opacity-80 transition-opacity">
              <img src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" alt="ANIME Token" className="h-10 w-10" />
              <div>
                <h2 className="font-bold text-lg">ANIME.TOKEN</h2>
                <p className="text-sm text-muted-foreground">Navigation Menu</p>
              </div>
            </Link>

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
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};