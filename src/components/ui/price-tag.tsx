import { cn } from "@/lib/utils";

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
  if (size === "lg") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-sm text-muted-foreground">Price</span>
        <span className="text-2xl font-bold">{amount}</span>
        <span className="text-lg text-muted-foreground">{currency}</span>
      </div>
    );
  }

  return (
    <span className={cn("text-sm font-medium", className)}>
      <span className="text-primary">Price</span> {amount} {currency}
    </span>
  );
};