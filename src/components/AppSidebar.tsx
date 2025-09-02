import { 
  Coins, 
  ShoppingCart, 
  Users,
  LucideIcon
} from "lucide-react";
import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { scrollToHash } from "@/lib/scroll";
import { homeSections } from "@/lib/homeSections";

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
} from "@/components/ui/sidebar"

type NavigationItem = RouteItem | SectionItem;

interface RouteItem {
  type: "route";
  title: string;
  icon: LucideIcon;
  path: string;
}

interface SectionItem {
  type: "section";
  title: string;
  icon: LucideIcon;
  hash: string;
}

const routes: RouteItem[] = [
  {
    type: "route",
    title: "Mint NFTs",
    icon: Coins,
    path: "/mint",
  },
  {
    type: "route", 
    title: "Marketplace",
    icon: ShoppingCart,
    path: "/marketplace",
  },
  {
    type: "route",
    title: "Profile",
    icon: Users,
    path: "/profile",
  },
];

const sections: SectionItem[] = homeSections.map(section => ({
  type: "section" as const,
  title: section.title,
  icon: section.icon,
  hash: section.hash,
}));

export function AppSidebar() {
  const { state, isMobile, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const showLabel = !isMobile && !isCollapsed;
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (item: NavigationItem, e?: React.MouseEvent) => {
    if (item.type === "route") {
      navigate(item.path);
      return;
    }

    // Navigate to home first if on different page
    if (location.pathname !== '/') {
      navigate(`/#${item.hash.replace('#', '')}`);
      return;
    }

    // Use robust scroll utility for reliable hash navigation
    scrollToHash(item.hash);
  };

  const isActive = (item: NavigationItem) => {
    if (item.type === "route") {
      return location.pathname === item.path;
    }
    return false;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={showLabel ? "" : "sr-only"}>
            Main Routes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center ${
                        isActive(item) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"
                      }`}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {showLabel && <span>{item.title}</span>}
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
                <SidebarMenuItem key={item.hash}>
                  <SidebarMenuButton 
                    asChild
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all"
                  >
                    <div 
                      onClick={(e) => {
                        // Only handle smooth scroll for unmodified left clicks
                        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                          handleNavigation(item, e);
                        }
                      }}
                      aria-label={item.title}
                      title={item.title}
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