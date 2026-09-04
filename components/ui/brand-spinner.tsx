import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "h-3 w-4", gap: "gap-[2px]" },
  md: { box: "h-5 w-6", gap: "gap-[3px]" },
  lg: { box: "h-8 w-10", gap: "gap-1" },
} as const;

/**
 * The branded loading indicator: three stacked bars lighting in sequence, read
 * as floors of a building filling up. It replaces the previous spinning ring —
 * a rotating circle is the most generic loader there is, and this one says
 * something about the product while occupying the same space.
 *
 * Uses currentColor so it stays visible inside a button of any variant; pass a
 * text-* class to colour it for standalone use.
 */
export function BrandSpinner({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { box, gap } = SIZES[size];
  return (
    <span
      className={cn("inline-flex shrink-0 flex-col-reverse justify-between", box, gap, className)}
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-full flex-1 rounded-[1px] bg-current"
          style={{
            animation: "fade-in 0.9s ease-in-out infinite alternate",
            animationDelay: `${i * 0.18}s`,
            opacity: 0.25,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </span>
  );
}
