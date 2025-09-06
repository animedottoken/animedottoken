import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { scrollToHash } from "@/lib/scroll";
import { Button } from "@/components/ui/button";
import { homeSections } from "@/lib/homeSections";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { useProfileFilters } from "@/contexts/ProfileFiltersContext";
import { useIsMobile } from "@/hooks/use-mobile";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type SectionItem = {
  type: "section";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  hash: string;
};

const sections: SectionItem[] = homeSections.map(section => ({
  type: "section" as const,
  title: section.title,
  icon: section.icon,
  hash: section.hash.replace('#', ''),
}));

interface DesktopSidebarProps {
  className?: string;
  style?: React.CSSProperties;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const DesktopSidebar = ({ className, style, onCollapseChange }: DesktopSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  // Get filters and ranges from context
  const { filters: combinedFilters, setFilters: setCombinedFilters, currentPriceRange, currentRoyaltyRange } = useProfileFilters();
  const isMobile = useIsMobile();

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

  const handleNavigation = (item: SectionItem, e?: React.MouseEvent) => {
    // Navigate to home first if on different page
    if (location.pathname !== "/") {
      navigate(`/#${item.hash}`);
      return;
    }

    // Use robust scroll utility for reliable hash navigation
    scrollToHash(`#${item.hash}`);
  };


  return (
    
      <aside 
        className={cn(
          "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-16" : "w-64",
          className
        )}
        style={style}
      >
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
              <img src="/brand/logo.png" alt="ANIME Token logo" className="h-8 w-8" />
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
              <img src="/brand/logo.png" alt="ANIME Token logo" className="h-8 w-8" />
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
          {/* Home Sections */}
          <div>
            {!collapsed && <h3 className="text-sm font-medium text-muted-foreground mb-2">Home Sections</h3>}
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

          {/* Search & Filter - Show only on profile page and desktop */}
          {!isMobile && location.pathname === '/profile' && !collapsed && (
            <div>
              <SearchFilterBar
                filters={combinedFilters}
                onFiltersChange={setCombinedFilters}
                showMarketplaceFilter={true}
                showPriceFilters={true}
                showRoyaltyFilters={true}
                showSourceFilter={true}
                showTypeFilter={true}
                showMediaTypeFilter={combinedFilters.type !== 'collections'} // Show only when viewing NFTs or all
                placeholder="Search..."
                collapsible={false}
                currentPriceRange={currentPriceRange}
                currentRoyaltyRange={currentRoyaltyRange}
              />
            </div>
          )}
        </nav>
      </aside>
    
  );
};