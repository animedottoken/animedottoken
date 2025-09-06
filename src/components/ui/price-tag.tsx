import { cn } from "@/lib/utils";


interface PriceTagProps {
  amount?: number;
  currency?: string;
  size?: "sm" | "lg";
  className?: string;
  tbd?: boolean;
}

export const PriceTag = ({ 
  amount, 
  currency = "SOL", 
  size = "sm", 
  className,
  tbd = false
}: PriceTagProps) => {
  if (size === "lg") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary">Price</span>
          <span className="text-2xl font-bold">
            {tbd ? "TBD" : amount}
          </span>
          <span className="text-lg text-muted-foreground">{currency}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("text-sm", className)}>
      <span className="font-medium">
        <span className="text-primary">Price</span> {tbd ? "TBD" : amount} {currency}
      </span>
    </div>
  );
};