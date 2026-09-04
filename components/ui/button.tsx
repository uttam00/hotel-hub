import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Buttons are rectangular with a 4px radius — instruments, not pills. There is
 * no lift-on-hover and no scale-on-press: in a console where a user clicks
 * hundreds of times an hour, movement under the cursor is noise. Hover changes
 * tone only; the pressed state darkens.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The single high-emphasis action on a screen. Solid brand ink.
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
        // Default for most console actions: reads as a control, not a call to
        // action, which is right when a toolbar has six of them.
        outline:
          "border border-border-strong bg-card text-foreground hover:bg-muted active:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent active:bg-accent",
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-accent",
        // Destructive is outlined by default so it never competes visually with
        // the primary action; the danger tone only fills in on hover. Makes
        // deleting a deliberate act rather than an easy one.
        destructive:
          "border border-danger-border bg-danger-subtle text-danger hover:bg-danger hover:text-destructive-foreground hover:border-danger",
        // For irreversible confirmations inside a dialog, where the user has
        // already been told what will happen.
        "destructive-solid":
          "bg-destructive text-destructive-foreground hover:bg-danger",
        link: "h-auto rounded-none p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3 [&_svg]:size-4",
        sm: "h-8 px-2.5 text-sm [&_svg]:size-3.5",
        xs: "h-7 px-2 text-xs [&_svg]:size-3.5",
        lg: "h-10 px-4 text-md [&_svg]:size-4",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-8 w-8 [&_svg]:size-4",
        "icon-xs": "h-7 w-7 [&_svg]:size-3.5",
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
