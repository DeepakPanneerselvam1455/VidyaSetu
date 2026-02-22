import React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default uses gradient for premium look
        default: "btn-gradient-primary shadow-md hover:shadow-lg hover:-translate-y-0.5",
        // Solid primary without gradient
        primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-sm hover:shadow-md hover:-translate-y-0.5",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline: "border border-[var(--border-strong)] bg-transparent text-[var(--text-main)] hover:bg-[var(--kpi-icon-chip)] hover:border-[var(--primary)]",
        secondary: "bg-[var(--kpi-icon-chip)] text-[var(--text-main)] border border-[var(--border-default)] hover:border-[var(--primary)] hover:bg-[var(--card-bg-hover,var(--card-bg))]",
        ghost: "text-[var(--text-secondary)] hover:bg-[var(--sidebar-active)] hover:text-[var(--text-main)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Fix: Changed interface to a type intersection and added `asChild` prop to resolve widespread type errors.
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // Fix: Destructured `asChild` to satisfy type checks and prevent it being passed to the DOM.
  ({ className, variant, size, asChild, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }