import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 36px control height matches Button's default, so inputs and buttons sit flush
 * on a single toolbar line. Focus is a ring plus a border colour change — the
 * border alone is too quiet against a bordered panel.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm border border-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-ui",
          "placeholder:text-faint",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
