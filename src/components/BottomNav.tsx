import { Home, User, ShoppingCart, Coins } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { 
    title: "Home", 
    icon: Home,
    path: "/",
  },
  { 
    title: "Mint", 
    icon: Coins,
    path: "/mint",
  },
  { 
    title: "Market", 
    icon: ShoppingCart,
    path: "/marketplace",
  },
  { 
    title: "Profile", 
    icon: User,
    path: "/profile",
  },
];

export const BottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};