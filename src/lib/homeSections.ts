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
    id: "nft-preview",
    title: "NFT Preview",
    icon: Coins,
    hash: "#nft-preview",
  },
  {
    id: "ownership",
    title: "Ownership Economy",
    icon: Users,
    hash: "#ownership",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: ShoppingCart,
    hash: "#marketplace",
  },
  {
    id: "trust",
    title: "Trust & Security",
    icon: Shield,
    hash: "#trust",
  },
  {
    id: "community",
    title: "Community",
    icon: Users,
    hash: "#community",
  },
  {
    id: "how-to-buy",
    title: "How to Buy",
    icon: HelpCircle,
    hash: "#how-to-buy",
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    hash: "#faq",
  },
  {
    id: "social",
    title: "Social Links",
    icon: Share2,
    hash: "#social",
  },
];