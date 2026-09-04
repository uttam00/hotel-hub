import { cn } from "@/lib/utils";

/**
 * A sweeping highlight rather than a pulsing opacity. Pulsing reads as
 * "something is wrong"; a sweep reads as "this is arriving" — and it keeps a
 * steady silhouette so the page doesn't appear to breathe while loading.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-sm bg-muted", className)}
      aria-hidden="true"
      {...props}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
    </div>
  );
}

/** Placeholder rows matched to the real table's 33px row height. */
function SkeletonTable({
  rows = 6,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-3 py-2.5">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5"
              style={{ width: c === 0 ? "22%" : `${Math.max(9, 18 - c * 2)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonTable };
