import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MenuSelect = DropdownMenuPrimitive.Root;

const MenuSelectGroup = DropdownMenuPrimitive.Group;

interface MenuSelectValueProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  children?: React.ReactNode;
}

const MenuSelectValue = React.forwardRef<HTMLDivElement, MenuSelectValueProps>(
  ({ className, placeholder, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm", className)}
      {...props}
    >
      {children || placeholder}
    </div>
  )
);
MenuSelectValue.displayName = "MenuSelectValue";

interface MenuSelectTriggerProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
  children?: React.ReactNode;
}

const MenuSelectTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  MenuSelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </DropdownMenuPrimitive.Trigger>
));
MenuSelectTrigger.displayName = "MenuSelectTrigger";

const MenuSelectContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
MenuSelectContent.displayName = "MenuSelectContent";

interface MenuSelectItemProps extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  value: string;
  children: React.ReactNode;
}

const MenuSelectItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  MenuSelectItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Item>
));
MenuSelectItem.displayName = "MenuSelectItem";

const MenuSelectLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
MenuSelectLabel.displayName = "MenuSelectLabel";

const MenuSelectSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
MenuSelectSeparator.displayName = "MenuSelectSeparator";

// Hook for controlled state management
interface UseMenuSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const useMenuSelect = ({ value, defaultValue, onValueChange }: UseMenuSelectProps = {}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [value, onValueChange]);

  return {
    value: currentValue,
    onValueChange: handleValueChange
  };
};

export {
  MenuSelect,
  MenuSelectGroup,
  MenuSelectValue,
  MenuSelectTrigger,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectLabel,
  MenuSelectSeparator,
  useMenuSelect,
};