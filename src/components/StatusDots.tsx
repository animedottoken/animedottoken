import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusDotsProps {
  isLoggedIn: boolean;
  isWalletConnected: boolean;
  size?: "sm" | "md";
  className?: string;
  showLogin?: boolean;
  showWallet?: boolean;
}

export const StatusDots = ({ 
  isLoggedIn, 
  isWalletConnected, 
  size = "sm", 
  className = "",
  showLogin = true,
  showWallet = true
}: StatusDotsProps) => {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        {showLogin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`${dotSize} rounded-full ${isLoggedIn ? 'bg-green-500' : 'bg-red-500'}`}
                aria-label={isLoggedIn ? "Signed in" : "Signed out"}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLoggedIn ? "Signed in" : "Signed out"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {showWallet && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`${dotSize} rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}
                aria-label={isWalletConnected ? "Wallet connected" : "Wallet not connected"}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{isWalletConnected ? "Wallet connected" : "Wallet not connected"}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};