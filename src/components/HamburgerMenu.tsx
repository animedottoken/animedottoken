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
  Users,
  Coins,
  Store,
  User
} from "lucide-react";

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
  },
  { 
    title: "My Profile", 
    icon: User,
    hash: "",
    onClick: () => {
      window.location.href = "/profile";
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