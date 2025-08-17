import { useState } from "react";
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
  Users
} from "lucide-react";

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
    hash: "",
    onClick: () => {
      window.history.pushState(null, "", "/");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  { 
    title: "Community Showcase", 
    icon: Users,
    hash: "featured-community-content",
    onClick: () => {
      window.history.pushState(null, "", "/#featured-community-content");
      document.querySelector('.featured-community-content')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "Trust & Security", 
    icon: Shield,
    hash: "trust-security-section",
    onClick: () => {
      window.history.pushState(null, "", "/#trust-security-section");
      document.querySelector('.trust-security-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "Ownership Calculator", 
    icon: Calculator,
    hash: "ownership-calculator",
    onClick: () => {
      window.history.pushState(null, "", "/#ownership-calculator");
      document.querySelector('.ownership-calculator')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "Market Chart", 
    icon: TrendingUp,
    hash: "market-cap-chart",
    onClick: () => {
      window.history.pushState(null, "", "/#market-cap-chart");
      document.querySelector('.market-cap-chart')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "How to Buy ANIME", 
    icon: ShoppingCart,
    hash: "how-to-buy",
    onClick: () => {
      window.history.pushState(null, "", "/#how-to-buy");
      document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "FAQ", 
    icon: HelpCircle,
    hash: "faq-section",
    onClick: () => {
      window.history.pushState(null, "", "/#faq-section");
      document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "NFT Program", 
    icon: Trophy,
    hash: "nft-supporter-section",
    onClick: () => {
      window.history.pushState(null, "", "/#nft-supporter-section");
      document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "NFT Marketplace", 
    icon: ShoppingBag,
    hash: "nft-gallery",
    onClick: () => {
      window.history.pushState(null, "", "/#nft-gallery");
      document.querySelector('.nft-gallery')?.scrollIntoView({ behavior: 'smooth' });
    }
  },
  { 
    title: "Share & Promote", 
    icon: Share2,
    hash: "share-promote-section",
    onClick: () => {
      window.history.pushState(null, "", "/#share-promote-section");
      document.getElementById('share-promote-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
];

export function AppSidebar() {
  const { state, open } = useSidebar();
  const isCollapsed = state === "collapsed" || !open;

  return (
    <Sidebar
      collapsible="icon"
      className={isCollapsed ? "w-16" : "w-64"}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Quick Navigation
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <div onClick={item.onClick} className="flex items-center">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
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