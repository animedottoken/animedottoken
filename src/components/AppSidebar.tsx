import { useState } from "react";
import { 
  Home, 
  ShoppingCart, 
  Shield, 
  Calculator, 
  TrendingUp, 
  ImageIcon, 
  HelpCircle,
  Share2,
  Trophy
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
    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  { 
    title: "NFT Program", 
    icon: Trophy,
    onClick: () => document.getElementById('nft-supporter-section')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "How to Buy", 
    icon: ShoppingCart,
    onClick: () => document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "Trust & Security", 
    icon: Shield,
    onClick: () => document.querySelector('.trust-security-section')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "Ownership Calculator", 
    icon: Calculator,
    onClick: () => document.querySelector('.ownership-calculator')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "Market Chart", 
    icon: TrendingUp,
    onClick: () => document.querySelector('.market-cap-chart')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "NFT Marketplace", 
    icon: ImageIcon,
    onClick: () => document.querySelector('.nft-gallery')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "FAQ", 
    icon: HelpCircle,
    onClick: () => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })
  },
  { 
    title: "Share & Promote", 
    icon: Share2,
    onClick: () => document.getElementById('share-promote-section')?.scrollIntoView({ behavior: 'smooth' })
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