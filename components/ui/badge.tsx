import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Low-key rectangular tags. Badges here are labels, not buttons — no hover
 * state, because a badge that lights up under the cursor reads as clickable.
 *
 * For entity status (payment, booking, room, attendance…) use <StatusBadge>
 * from components/ui/status-badge instead: it pairs the tone with an icon and
 * a written label so status is never carried by colour alone.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium leading-4 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary-border bg-primary-subtle text-primary",
        secondary: "border-border bg-muted text-muted-foreground",
        outline: "border-border-strong bg-transparent text-foreground",
        success: "border-success-border bg-success-subtle text-success",
        warning: "border-warning-border bg-warning-subtle text-warning",
        danger: "border-danger-border bg-danger-subtle text-danger",
        destructive: "border-danger-border bg-danger-subtle text-danger",
        info: "border-info-border bg-info-subtle text-info",
        neutral: "border-neutral-border bg-neutral-subtle text-neutral",
        /** Solid fill — reserve for counts on dark surfaces (sidebar badges). */
        solid: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
