import React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent",
        secondary:
          "bg-[var(--sidebar-bg)] text-[var(--text-main)] border-[var(--border-default)]",
        destructive:
          "bg-red-500 text-white border-transparent",
        success:
          "badge-success-themed",
        outline: "bg-transparent text-[var(--text-main)] border-[var(--border-default)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Fix: Changed interface to a type intersection to correctly include VariantProps.
export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }