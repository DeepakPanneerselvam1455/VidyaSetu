
import React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, error, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 md:h-10 w-full rounded-md border-2 px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 input-themed",
          hasError && "border-red-500 focus:border-red-600",
          className
        )}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: hasError ? 'hsl(0 65% 50%)' : 'var(--border-default)',
          color: 'var(--text-main)',
          ...style
        }}
        aria-invalid={hasError}
        aria-describedby={hasError && props.id ? `${props.id}-error` : undefined}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }