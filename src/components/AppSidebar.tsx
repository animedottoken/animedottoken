import { 
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

interface SectionItem {
  type: "section";
  title: string;
  icon: LucideIcon;
  hash: string;
}

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

  const handleNavigation = (item: SectionItem, e?: React.MouseEvent) => {
    // Navigate to home first if on different page
    if (location.pathname !== '/') {
      navigate(`/#${item.hash.replace('#', '')}`);
      return;
    }

    // Use robust scroll utility for reliable hash navigation
    scrollToHash(item.hash);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
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