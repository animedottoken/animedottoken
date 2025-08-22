import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Specialized Input component that prevents browser autofill
export const MintInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn(
          "h-12 text-lg font-medium border-2 hover:border-primary/50 focus:border-primary focus:shadow-primary/20 focus:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm",
          className
        )}
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore
        {...props}
        ref={ref}
      />
    )
  }
)
MintInput.displayName = "MintInput"

// Specialized Textarea component that prevents browser autofill
export const MintTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        className={cn(
          "min-h-[120px] text-lg font-medium border-2 hover:border-primary/50 focus:border-primary focus:shadow-primary/20 focus:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm resize-none",
          className
        )}
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore
        {...props}
        ref={ref}
      />
    )
  }
)
MintTextarea.displayName = "MintTextarea"