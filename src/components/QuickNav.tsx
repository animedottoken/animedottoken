import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, User, ShoppingCart } from "lucide-react";

interface QuickNavProps {
  className?: string;
}

export const QuickNav = ({ className = "" }: QuickNavProps) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button variant="outline" size="sm" asChild>
        <Link to="/">
          <Home className="w-4 h-4 mr-2" />
          Home
        </Link>
      </Button>
      
      <Button variant="outline" size="sm" asChild>
        <Link to="/profile?tab=collections">
          <User className="w-4 h-4 mr-2" />
          My Collections
        </Link>
      </Button>
      
      <Button variant="outline" size="sm" asChild>
        <Link to="/marketplace">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Marketplace
        </Link>
      </Button>
    </div>
  );
};