import { 
  Home, 
  ShoppingCart, 
  Shield, 
  Calculator, 
  TrendingUp, 
  ShoppingBag, 
  HelpCircle,
  Share2,
  Trophy,
  Users,
  Coins
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { 
    title: "Home", 
    icon: Home,
    path: "/",
    type: "route" as const
  },
  { 
    title: "My Profile", 
    icon: Users,
    path: "/profile",
    type: "route" as const
  },
  { 
    title: "Mint NFTs", 
    icon: Coins,
    path: "/mint",
    type: "route" as const
  },
  { 
    title: "NFT Marketplace", 
    icon: ShoppingBag,
    path: "/marketplace",
    type: "route" as const
  },
  { 
    title: "Community Showcase", 
    icon: Users,
    hash: "featured-community-content",
    type: "section" as const
  },
  { 
    title: "Trust & Security", 
    icon: Shield,
    hash: "trust-security-section",
    type: "section" as const
  },
  { 
    title: "Ownership Calculator", 
    icon: Calculator,
    hash: "ownership-calculator",
    type: "section" as const
  },
  { 
    title: "Market Chart", 
    icon: TrendingUp,
    hash: "market-cap-chart",
    type: "section" as const
  },
  { 
    title: "How to Buy ANIME", 
    icon: ShoppingCart,
    hash: "how-to-buy",
    type: "section" as const
  },
  { 
    title: "FAQ", 
    icon: HelpCircle,
    hash: "faq-section",
    type: "section" as const
  },
  { 
    title: "ANIME ARMY", 
    icon: Trophy,
    hash: "nft-supporter-section",
    type: "section" as const
  },
  { 
    title: "Create NFTs", 
    icon: Coins,
    hash: "create-nfts",
    type: "section" as const
  },
  { 
    title: "Share & Promote", 
    icon: Share2,
    hash: "share-promote-section",
    type: "section" as const
  }
];

export function AppSidebar() {
  const { state, isMobile, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const showLabel = !isMobile && !isCollapsed;
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isMobile && isCollapsed) {
      setOpen(true);
    }
  }, [isMobile, isCollapsed, setOpen]);

  const handleNavigation = (item: typeof navigationItems[0], e?: React.MouseEvent) => {
    if (item.type === "route") {
      navigate(item.path!);
      return;
    }

    // Native anchor behavior for sections
    if (location.pathname !== '/') {
      navigate(`/#${item.hash!}`);
    } else {
      window.location.hash = `#${item.hash!}`;
    }
  };

  const isActive = (item: typeof navigationItems[0]) => {
    if (item.type === "route") {
      return location.pathname === item.path;
    }
    return false;
  };

  // Separate routes and sections
  const routes = navigationItems.filter(item => item.type === "route");
  const sections = navigationItems.filter(item => item.type === "section");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={showLabel ? "" : "sr-only"}>
            Main Pages
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground ${
                      isActive(item) ? "bg-muted text-primary font-medium" : ""
                    }`}
                    tooltip={!showLabel ? item.title : undefined}
                  >
                    <Link to={item.path!}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {showLabel && <span className="ml-2">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={showLabel ? "" : "sr-only"}>
            Home Sections
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all"
                    tooltip={!showLabel ? item.title : undefined}
                  >
                    <div 
                      onClick={(e) => {
                        // Only handle smooth scroll for unmodified left clicks
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          handleNavigation(item, e);
                        }
                      }}
                      data-testid={item.hash === 'create-nfts' ? 'sidebar-create-nfts' : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {showLabel && <span className="ml-2">{item.title}</span>}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}