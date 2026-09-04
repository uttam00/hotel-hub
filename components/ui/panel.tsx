import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The console's structural container.
 *
 * A panel is a bordered region with an optional titled band across the top.
 * It replaces the pattern of Card + CardHeader + CardTitle + CardContent that
 * was repeated on every admin page, and it enforces the two things that made
 * those inconsistent: the header band's height and the fact that a panel
 * containing a table must not add padding (the table supplies its own).
 */

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-md border border-border bg-card", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[2.75rem] flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

/** Padded body. Omit for tables, which manage their own edge-to-edge spacing. */
export function PanelBody({ children, className }: PanelProps) {
  return <div className={cn("p-3", className)}>{children}</div>;
}

export function PanelFooter({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-t border-border bg-surface-sunken px-3 py-2 text-sm text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labelled key/value row — the backbone of every detail view (resident stay
 * details, room specification, hostel address). Uses a fixed-width label
 * column so values line up down the page.
 */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-3 py-1.5", className)}>
      <dt className="w-32 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function FieldList({ children, className }: PanelProps) {
  return <dl className={cn("divide-y divide-border", className)}>{children}</dl>;
}
