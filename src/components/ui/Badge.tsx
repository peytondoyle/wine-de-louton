import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
        neutral: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-200",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
