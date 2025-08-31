import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, ShoppingCart, Coins, FileText, Star, Target, LifeBuoy, Trophy, Users, Shield, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { scrollToHash } from "@/lib/scroll";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
  
  // Home sections - ordered to match actual homepage flow
  { type: "section", title: "Minting NFT & Marketplace", icon: Coins, hash: "create-nfts" },
  { type: "section", title: "Ownership Calculator", icon: FileText, hash: "ownership-calculator" },
  { type: "section", title: "Market Chart", icon: Target, hash: "market-cap-chart" },
  { type: "section", title: "Trust & Security", icon: Shield, hash: "trust-security-section" },
  { type: "section", title: "ANIME.TOKEN ARMY", icon: Trophy, hash: "nft-supporter-section" },
  { type: "section", title: "Community Showcase", icon: Users, hash: "featured-community-content" },
  { type: "section", title: "How to Buy $ANIME", icon: ShoppingCart, hash: "how-to-buy" },
  { type: "section", title: "FAQ", icon: Star, hash: "faq-section" },
  { type: "section", title: "Get In Touch", icon: LifeBuoy, hash: "get-in-touch" },
];

interface DesktopSidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const DesktopSidebar = ({ className, onCollapseChange }: DesktopSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleCollapseToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

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
    if (item.type === "route") {
      navigate(item.path);
      return;
    }

    // Navigate to home first if on different page
    if (location.pathname !== "/") {
      navigate(`/#${item.hash}`);
      return;
    }

    // Use robust scroll utility for reliable hash navigation
    scrollToHash(`#${item.hash}`);
  };

  const isActive = (item: NavigationItem) => {
    if (item.type === "route") {
      return location.pathname === item.path;
    }
    return false;
  };

  const routes = navigationItems.filter((item): item is RouteItem => item.type === "route");
  const sections = navigationItems.filter((item): item is SectionItem => item.type === "section");

  return (
    
      <aside className={cn(
        "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
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
          )}
          {collapsed && (
            <Link 
              to="/"
              onClick={(e) => {
                // Only handle smooth scroll for unmodified left clicks
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  handleHomeNavigation();
                }
              }}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src="/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png" alt="ANIME Token" className="h-8 w-8" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapseToggle}
            className="p-2"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Home Sections Only */}
          <div>
            <div className="space-y-1">
              {sections.map((item) => (
                <Button
                  key={item.hash}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      handleNavigation(item, e);
                    }
                  }}
                  aria-label={item.title}
                  title={item.title}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    
  );
};