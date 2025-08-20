import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, ShoppingCart, Coins, FileText, Star, Target, Trophy, Users, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  
  // Home sections - matching live version exactly
  { type: "section", title: "Community Showcase", icon: Users, hash: "featured-community-content" },
  { type: "section", title: "Trust & Security", icon: Shield, hash: "trust-security-section" },
  { type: "section", title: "Ownership Calculator", icon: FileText, hash: "ownership-calculator" },
  { type: "section", title: "Market Chart", icon: Target, hash: "market-chart" },
  { type: "section", title: "How to Buy ANIME", icon: ShoppingCart, hash: "how-to-buy" },
  { type: "section", title: "FAQ", icon: Star, hash: "faq" },
  { type: "section", title: "ANIME ARMY", icon: Trophy, hash: "anime-army" },
  { type: "section", title: "NFT Marketplace", icon: Coins, hash: "nft-marketplace" },
  { type: "section", title: "Share & Promote", icon: Target, hash: "share-promote" },
  { type: "section", title: "Reports", icon: FileText, hash: "security-reports" },
];

interface DesktopSidebarProps {
  className?: string;
}

export const DesktopSidebar = ({ className }: DesktopSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (item: NavigationItem) => {
    if (item.type === "route") {
      navigate(item.path);
    } else {
      // Section navigation
      const element = document.getElementById(item.hash) || document.querySelector(`.${item.hash}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
    <TooltipProvider>
      <aside className={cn(
        "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/32b1e8d9-5985-42ca-9e1d-7d0b6a02ac81.png" alt="ANIME Token" className="h-8 w-8" />
              <span className="font-bold text-lg">ANIME.TOKEN</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Routes */}
          <div>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
                Main Pages
              </h3>
            )}
            <div className="space-y-1">
              {routes.map((item) => {
                const active = isActive(item);
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-10",
                          collapsed && "justify-center px-2"
                        )}
                        asChild
                      >
                        <Link to={item.path}>
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span className="font-medium">{item.title}</span>}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* Home Sections */}
          <div>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3">
                Home Sections
              </h3>
            )}
            <div className="space-y-1">
              {sections.map((item) => (
                <Tooltip key={item.hash} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        collapsed && "justify-center px-2"
                      )}
                      onClick={() => handleNavigation(item)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>{item.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  );
};