"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts confirm that an action landed ("Payment of ₹8,500 recorded"). They use
 * the same rectangular geometry and overlay elevation as every other floating
 * surface, and sit bottom-right so they never cover the console's top toolbar.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-md group-[.toaster]:border group-[.toaster]:border-border-strong group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:shadow-overlay group-[.toaster]:text-sm",
          title: "group-[.toast]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:rounded-sm group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:rounded-sm group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          success: "group-[.toaster]:[&_[data-icon]]:text-success",
          error: "group-[.toaster]:[&_[data-icon]]:text-danger",
          warning: "group-[.toaster]:[&_[data-icon]]:text-warning",
          info: "group-[.toaster]:[&_[data-icon]]:text-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
