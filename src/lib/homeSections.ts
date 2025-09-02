import { 
  Home, 
  Coins, 
  ShoppingCart, 
  Users, 
  Shield, 
  HelpCircle, 
  Share2,
  LucideIcon
} from "lucide-react";

export interface HomeSection {
  id: string;
  title: string;
  icon: LucideIcon;
  hash: string;
}

export const homeSections: HomeSection[] = [
  {
    id: "hero",
    title: "Welcome",
    icon: Home,
    hash: "#hero",
  },
  {
    id: "create-nfts",
    title: "Mint NFTs & Marketplace",
    icon: Coins,
    hash: "#create-nfts",
  },
  {
    id: "ownership-calculator",
    title: "Ownership Economy",
    icon: Users,
    hash: "#ownership-calculator",
  },
  {
    id: "trust-security-section",
    title: "Trust & Security",
    icon: Shield,
    hash: "#trust-security-section",
  },
  {
    id: "nft-supporter-section",
    title: "ANIME.TOKEN ARMY",
    icon: Users,
    hash: "#nft-supporter-section",
  },
  {
    id: "featured-community-content",
    title: "Community Showcase",
    icon: Users,
    hash: "#featured-community-content",
  },
  {
    id: "how-to-buy",
    title: "How to Buy ANIME",
    icon: ShoppingCart,
    hash: "#how-to-buy",
  },
  {
    id: "faq-section",
    title: "FAQ",
    icon: HelpCircle,
    hash: "#faq-section",
  },
  {
    id: "get-in-touch",
    title: "Get in Touch",
    icon: Share2,
    hash: "#get-in-touch",
  },
];