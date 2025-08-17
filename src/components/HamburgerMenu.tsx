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
  Menu,
  X,
  Users
} from "lucide-react";

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

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false); // Close menu after clicking
  };

  return (
    <>
      {/* Hamburger Button - Always visible in top right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200 p-3 rounded-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-16 right-4 z-40 bg-background/95 backdrop-blur-sm border shadow-xl rounded-lg p-2 min-w-[200px]">
          {navigationItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleMenuClick(item.onClick)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="text-sm">{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}