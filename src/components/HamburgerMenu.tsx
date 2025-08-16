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
  Trophy,
  Menu,
  X
} from "lucide-react";

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
    title: "NFT Gallery", 
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