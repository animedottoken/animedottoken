import { cn } from "@/lib/utils";
import { useMarketplaceSettings } from "@/hooks/useMarketplaceSettings";

interface PriceTagProps {
  amount: number;
  currency?: string;
  size?: "sm" | "lg";
  className?: string;
}

export const PriceTag = ({ 
  amount, 
  currency = "SOL", 
  size = "sm", 
  className 
}: PriceTagProps) => {
  const { settings } = useMarketplaceSettings();
  
  // Calculate seller amount after platform fee
  const platformFeePercentage = (settings?.platform_fee_percentage || 2.5) / 100;
  const sellerReceives = amount * (1 - platformFeePercentage);

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="text-2xl font-bold">{amount}</span>
          <span className="text-lg text-muted-foreground">{currency}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Seller receives {sellerReceives.toFixed(3)} {currency} after {settings?.platform_fee_percentage || 2.5}% fee
        </span>
      </div>
    );
  }

  return (
    <div className={cn("text-sm", className)}>
      <span className="font-medium">
        <span className="text-primary">Price</span> {amount} {currency}
      </span>
      <div className="text-xs text-muted-foreground mt-1">
        Seller receives {sellerReceives.toFixed(3)} {currency}
      </div>
    </div>
  );
};