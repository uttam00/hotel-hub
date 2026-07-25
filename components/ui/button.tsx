import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 text-primary-foreground backdrop-blur-xl shadow-glass-sm hover:bg-primary hover:shadow-glass-md hover:-translate-y-0.5 active:scale-[0.98]",
        destructive:
          "bg-destructive/90 text-destructive-foreground backdrop-blur-xl shadow-glass-sm hover:bg-destructive hover:shadow-glass-md hover:-translate-y-0.5 active:scale-[0.98]",
        outline:
          "border border-border/60 bg-card/40 backdrop-blur-xl hover:bg-card/70 hover:-translate-y-0.5 hover:shadow-glass-sm active:scale-[0.98]",
        secondary:
          "bg-secondary/70 text-secondary-foreground backdrop-blur-xl hover:bg-secondary/90 hover:-translate-y-0.5 hover:shadow-glass-sm active:scale-[0.98]",
        ghost:
          "hover:bg-accent/60 hover:backdrop-blur-xl hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
