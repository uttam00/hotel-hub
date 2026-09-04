import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A metric is number + context + trend + meaning (§10) — never a number alone.
 *
 * These are laid out as a single bordered strip of equal columns rather than as
 * separate floating cards: it reads as one instrument panel, costs far less
 * vertical space than a 4-up card grid, and keeps the values on a shared
 * baseline so they can be compared at a glance.
 */

export function MetricRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 overflow-hidden rounded-md border border-border bg-card",
        "sm:grid-cols-2 xl:grid-cols-4",
        // Dividers between columns, and between stacked rows on narrow screens.
        "[&>*]:border-b [&>*]:border-border",
        "sm:[&>*:nth-last-child(-n+2)]:border-b-0 sm:[&>*:nth-child(odd)]:border-r",
        "xl:[&>*]:border-b-0 xl:[&>*]:border-r xl:[&>*:last-child]:border-r-0",
        "[&>*:last-child]:border-b-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface TrendProps {
  /** Percentage change. Sign determines direction. */
  value: number;
  /** What the comparison is against, e.g. "vs last month". */
  label?: string;
  /**
   * Whether a rise is good. Collections rising is good; dues rising is not —
   * so the colour follows meaning, not direction.
   */
  goodDirection?: "up" | "down" | "neutral";
}

function Trend({ value, label, goodDirection = "up" }: TrendProps) {
  const flat = Math.abs(value) < 0.05;
  const rising = value > 0;
  const Icon = flat ? ArrowRight : rising ? ArrowUpRight : ArrowDownRight;

  const good =
    goodDirection === "neutral" || flat
      ? null
      : goodDirection === "up"
      ? rising
      : !rising;

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Icon
        className={cn(
          "size-3 shrink-0",
          good === null ? "text-muted-foreground" : good ? "text-success" : "text-danger"
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-medium",
          good === null ? "text-muted-foreground" : good ? "text-success" : "text-danger"
        )}
      >
        {flat ? "No change" : `${rising ? "+" : ""}${value.toFixed(1)}%`}
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  );
}

export function Metric({
  label,
  value,
  context,
  trend,
  meter,
  href,
  emphasis = "default",
  className,
}: {
  label: string;
  /** The headline figure, pre-formatted (₹4.82L, 86.4%, 27). */
  value: ReactNode;
  /** The denominator or breakdown that makes the figure mean something. */
  context?: ReactNode;
  trend?: TrendProps;
  /** 0–100; renders a thin proportional bar beneath the value. */
  meter?: { pct: number; tone?: "brand" | "success" | "warning" | "danger" };
  /** Makes the whole tile a link to the page that lets you act on it. */
  href?: string;
  /** `alert` tints the tile when the figure needs attention (overdue dues). */
  emphasis?: "default" | "alert";
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="label-annotation truncate">{label}</span>
        {href && (
          <ArrowUpRight
            className="size-3.5 shrink-0 text-faint opacity-0 transition-ui group-hover/metric:opacity-100"
            aria-hidden="true"
          />
        )}
      </div>

      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-semibold leading-none tracking-tight",
          emphasis === "alert" ? "text-danger" : "text-foreground"
        )}
      >
        {value}
      </div>

      {meter && (
        <div
          className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted"
          role="presentation"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              meter.tone === "success" && "bg-success",
              meter.tone === "warning" && "bg-warning",
              meter.tone === "danger" && "bg-danger",
              (!meter.tone || meter.tone === "brand") && "bg-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, meter.pct))}%` }}
          />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {context && <span className="text-xs text-muted-foreground">{context}</span>}
        {trend && <Trend {...trend} />}
      </div>
    </>
  );

  const shell = cn(
    "group/metric block p-3.5 transition-ui",
    emphasis === "alert" && "bg-danger-subtle/40",
    href && "hover:bg-muted/60",
    className
  );

  return href ? (
    <Link href={href} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}
