import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Inline notices. Each variant carries a tinted wash *and* a matching border
 * and icon colour, so the message type survives greyscale and colour-blindness
 * — callers are expected to pass an icon.
 */
const alertVariants = cva(
  "relative w-full rounded-md border px-3 py-2.5 text-sm [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 [&>svg]:size-4 [&>svg~*]:pl-6",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/60 text-foreground [&>svg]:text-muted-foreground",
        info: "border-info-border bg-info-subtle text-foreground [&>svg]:text-info",
        success:
          "border-success-border bg-success-subtle text-foreground [&>svg]:text-success",
        warning:
          "border-warning-border bg-warning-subtle text-foreground [&>svg]:text-warning",
        destructive:
          "border-danger-border bg-danger-subtle text-foreground [&>svg]:text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold leading-tight tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
