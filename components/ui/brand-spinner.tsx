import { Building } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { ring: "h-4 w-4", icon: "h-2 w-2", border: "border-2" },
  md: { ring: "h-8 w-8", icon: "h-3.5 w-3.5", border: "border-2" },
  lg: { ring: "h-12 w-12", icon: "h-5 w-5", border: "border-[3px]" },
} as const;

/**
 * HostelHub's small branded loading indicator — a spinning ring around the
 * brand mark. Uses currentColor throughout (not a hardcoded text-primary) so
 * it stays visible when dropped into a button of any variant — pass a
 * text-* className to set the color explicitly for standalone use.
 */
export function BrandSpinner({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { ring, icon, border } = SIZES[size];
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", ring, className)}
    >
      <span className={cn("absolute inset-0 rounded-full border-current opacity-25", border)} />
      <span
        className={cn(
          "absolute inset-0 animate-spin rounded-full border-transparent border-t-current",
          border
        )}
      />
      <Building className={icon} />
      <span className="sr-only">Loading</span>
    </span>
  );
}
