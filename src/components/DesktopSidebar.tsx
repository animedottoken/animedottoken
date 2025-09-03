import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, ShoppingCart, Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { scrollToHash } from "@/lib/scroll";
import { Button } from "@/components/ui/button";
import { homeSections } from "@/lib/homeSections";
import { MarketplaceFilterSidebar } from "@/components/MarketplaceFilterSidebar";

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

const routes: RouteItem[] = [
  { type: "route", title: "Mint NFTs", icon: Coins, path: "/mint" },
  { type: "route", title: "Marketplace", icon: ShoppingCart, path: "/marketplace" },
  { type: "route", title: "Profile", icon: User, path: "/profile" },
];

const sections: SectionItem[] = homeSections.map(section => ({
  type: "section" as const,
  title: section.title,
  icon: section.icon,
  hash: section.hash.replace('#', ''),
}));

interface DesktopSidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const DesktopSidebar = ({ className, onCollapseChange }: DesktopSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Show marketplace filters for specific pages
  const filterRoutes = ['/marketplace', '/profile'];
  const isCreatorProfileRoute = location.pathname.startsWith('/profile/');
  const shouldShowFilters = filterRoutes.includes(location.pathname) || isCreatorProfileRoute;

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
          {/* Route Links */}
          <div>
            <div className="space-y-1">
              {routes.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2",
                    isActive(item) && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => navigate(item.path)}
                  aria-label={item.title}
                  title={item.title}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Button>
              ))}
            </div>
          </div>

          {/* Home Sections - always show */}
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

          {/* Filters Section - show below home sections on filter routes */}
          {shouldShowFilters && !collapsed && (
            <MarketplaceFilterSidebar embedded />
          )}
        </nav>
      </aside>
    
  );
};