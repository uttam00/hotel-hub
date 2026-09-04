import Link from "next/link";
import { FileX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  /** For actions that open a drawer rather than navigate. */
  onAction?: () => void;
  /** Extra controls (e.g. a secondary "Clear filters"). */
  children?: React.ReactNode;
  /** `inline` drops the framing for use inside a table cell or small panel. */
  variant?: "panel" | "inline";
  className?: string;
}

/**
 * An empty state should say what is true, not that a query returned zero rows
 * ("No pending dues — every resident is up to date" beats "No data found").
 * Callers supply that sentence; this component supplies the framing.
 *
 * The mark sits on a fragment of the blueprint grid, tying the empty moment to
 * the same drawing language as the occupancy plan.
 */
export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  children,
  variant = "panel",
  className,
}: EmptyStateProps) {
  const action =
    actionLabel && actionHref ? (
      <Button asChild size="sm">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : actionLabel && onAction ? (
      <Button size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        variant === "panel" ? "py-14" : "py-8",
        className
      )}
    >
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
        <span className="blueprint-grid absolute inset-0 rounded-md border border-border opacity-70" />
        <Icon className="relative h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {(action || children) && (
        <div className="mt-4 flex items-center gap-2">
          {action}
          {children}
        </div>
      )}
    </div>
  );
}
