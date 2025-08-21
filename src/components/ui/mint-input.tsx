import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Specialized Input component that prevents browser autofill
export const MintInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn(className)}
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
        className={cn(className)}
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