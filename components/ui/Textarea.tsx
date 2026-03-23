
import React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | null;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, error, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] md:min-h-[80px] w-full rounded-md border-2 px-3 py-2.5 md:py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 input-themed",
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
Textarea.displayName = "Textarea"

export { Textarea }
