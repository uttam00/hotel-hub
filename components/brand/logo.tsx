import { Building } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The HostelHub mark.
 *
 * The existing brand is the lucide `Building` glyph plus the "HostelHub"
 * wordmark — that is kept exactly as-is. What is added here is a consistent
 * *setting* for it: a small ink-indigo tile with the same 6px geometry as the
 * rest of the system, so the mark reads as a deliberate logotype instead of a
 * loose icon sitting next to text. Centralising it also means the mark is
 * identical in the sidebar, the console header, auth screens, empty states and
 * loading states rather than being re-hand-rolled in each.
 *
 * Deliberately small everywhere. The product is the hero, not the logo.
 */

const SIZES = {
  sm: { tile: "h-6 w-6 rounded-[5px]", icon: "h-3.5 w-3.5", text: "text-sm" },
  md: { tile: "h-7 w-7 rounded-md", icon: "h-4 w-4", text: "text-md" },
  lg: { tile: "h-9 w-9 rounded-md", icon: "h-5 w-5", text: "text-lg" },
} as const;

export function LogoMark({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        s.tile,
        className
      )}
      aria-hidden="true"
    >
      <Building className={s.icon} strokeWidth={2} />
    </span>
  );
}

export function Logo({
  size = "md",
  showWordmark = true,
  /** Inverted contexts (the dark sidebar) need light wordmark ink. */
  tone = "default",
  className,
}: {
  size?: keyof typeof SIZES;
  showWordmark?: boolean;
  tone?: "default" | "inverted";
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            s.text,
            tone === "inverted" ? "text-white" : "text-foreground"
          )}
        >
          HostelHub
        </span>
      )}
      <span className="sr-only">HostelHub</span>
    </span>
  );
}
