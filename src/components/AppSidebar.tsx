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
  Users,
  Coins
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
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  },
  { 
    title: "Community Showcase", 
    icon: Users,
    hash: "featured-community-content",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#featured-community-content';
      } else {
        document.querySelector('.featured-community-content')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "Trust & Security", 
    icon: Shield,
    hash: "trust-security-section",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#trust-security-section';
      } else {
        document.querySelector('.trust-security-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "Ownership Calculator", 
    icon: Calculator,
    hash: "ownership-calculator",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#ownership-calculator';
      } else {
        document.querySelector('.ownership-calculator')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "Market Chart", 
    icon: TrendingUp,
    hash: "market-cap-chart",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#market-cap-chart';
      } else {
        document.querySelector('.market-cap-chart')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "How to Buy ANIME", 
    icon: ShoppingCart,
    hash: "how-to-buy",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#how-to-buy';
      } else {
        document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "FAQ", 
    icon: HelpCircle,
    hash: "faq-section",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#faq-section';
      } else {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "ANIME ARMY", 
    icon: Trophy,
    hash: "nft-supporter-section",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#nft-supporter-section';
      } else {
        document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  { 
    title: "My Profile", 
    icon: Users,
    hash: "profile",
    onClick: () => {
      window.location.href = '/profile';
    }
  },
  { 
    title: "My Collections", 
    icon: ShoppingBag,
    hash: "collections", 
    onClick: () => {
      window.location.href = '/collections';
    }
  },
  { 
    title: "Mint NFTs", 
    icon: Coins,
    hash: "mint",
    onClick: () => {
      window.location.href = '/mint';
    }
  },
  { 
    title: "NFT Marketplace", 
    icon: ShoppingBag,
    hash: "marketplace",
    onClick: () => {
      window.location.href = '/marketplace';
    }
  },
  { 
    title: "Share & Promote", 
    icon: Share2,
    hash: "share-promote-section",
    onClick: () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/#share-promote-section';
      } else {
        document.getElementById('share-promote-section')?.scrollIntoView({ behavior: 'smooth' });
      }
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