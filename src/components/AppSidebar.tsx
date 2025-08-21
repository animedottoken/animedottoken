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
import { useNavigate, useLocation } from "react-router-dom";
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
    title: "🎨Create & Trade NFTs on Solana", 
    icon: ShoppingCart,
    hash: "create-trade-nfts",
    type: "section" as const
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

  const handleNavigation = (item: typeof navigationItems[0]) => {
    if (item.type === "route") {
      navigate(item.path!);
    } else {
      // For sections, navigate to home first if not there
      if (location.pathname !== '/') {
        navigate(`/#${item.hash}`);
      } else {
        // Scroll to section if already on home
        const element = document.getElementById(item.hash!) || 
                       document.querySelector(`.${item.hash!}`);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
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
                    onClick={() => handleNavigation(item)}
                    className={`cursor-pointer transition-colors ${
                      isActive(item) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                    }`}
                    tooltip={!showLabel ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {showLabel && <span className="ml-2">{item.title}</span>}
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
                    onClick={() => handleNavigation(item)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    tooltip={!showLabel ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="ml-2">{item.title}</span>}
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