import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileStyleEditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  tooltipContent?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfileStyleEditButton = ({ 
  onClick, 
  disabled = false, 
  tooltipContent,
  size = 'md',
  className = '' 
}: ProfileStyleEditButtonProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const button = (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-background/80 
        backdrop-blur-sm
        hover:bg-background/90
        border-2
        border-border/50
        hover:border-border
        transition-all
        duration-200
        shadow-lg
        hover:shadow-xl
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
    >
      <Camera size={iconSizes[size]} className="text-muted-foreground" />
    </Button>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};