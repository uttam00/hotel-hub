"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  LogIn,
  LogOut,
  UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

/**
 * OPERATIONS PULSE — the "what needs me today" strip.
 *
 * Four things a warden must know the moment they sit down: who is arriving, who
 * is leaving, what money is late, and who is inside the building right now.
 * Each is a link to the page where you act on it, so the dashboard is a
 * dispatcher rather than a read-only report.
 *
 * Rows with nothing pending are stated positively ("No arrivals today") instead
 * of being hidden — knowing that nothing is due is itself the answer.
 */

interface PulseItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
  href: string;
  /** Draws attention when the figure represents something unhandled. */
  alert?: boolean;
}

export function OperationsPulse({
  arrivalsToday,
  departuresToday,
  overdueCount,
  overdueAmount,
  visitorsOnPremises,
  loading = false,
}: {
  arrivalsToday: number;
  departuresToday: number;
  overdueCount: number;
  overdueAmount: number;
  visitorsOnPremises: number;
  loading?: boolean;
}) {
  const items: PulseItem[] = [
    {
      icon: LogIn,
      label: "Arriving today",
      value: String(arrivalsToday),
      detail:
        arrivalsToday === 0
          ? "No check-ins scheduled"
          : `${arrivalsToday} resident${arrivalsToday === 1 ? "" : "s"} to check in`,
      href: "/hostel-admin/bookings?filter=arrivals",
    },
    {
      icon: LogOut,
      label: "Leaving today",
      value: String(departuresToday),
      detail:
        departuresToday === 0
          ? "No check-outs scheduled"
          : `${departuresToday} room${departuresToday === 1 ? "" : "s"} freeing up`,
      href: "/hostel-admin/bookings?filter=departures",
    },
    {
      icon: AlertTriangle,
      label: "Overdue dues",
      value: formatCurrency(overdueAmount),
      detail:
        overdueCount === 0
          ? "Everyone is up to date"
          : `${overdueCount} payment${overdueCount === 1 ? "" : "s"} past due`,
      href: "/hostel-admin/payments?status=OVERDUE",
      alert: overdueCount > 0,
    },
    {
      icon: UserCheck,
      label: "Visitors inside",
      value: String(visitorsOnPremises),
      detail:
        visitorsOnPremises === 0
          ? "Nobody signed in"
          : `${visitorsOnPremises} yet to sign out`,
      href: "/hostel-admin/visitors",
      alert: false,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-border p-3.5 last:border-b-0 xl:border-b-0 xl:border-r">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
            <div className="mt-2 h-6 w-16 animate-pulse rounded-sm bg-muted" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 overflow-hidden rounded-md border border-border bg-card sm:grid-cols-2 xl:grid-cols-4",
        "[&>*]:border-b [&>*]:border-border",
        "sm:[&>*:nth-last-child(-n+2)]:border-b-0 sm:[&>*:nth-child(odd)]:border-r",
        "xl:[&>*]:border-b-0 xl:[&>*]:border-r xl:[&>*:last-child]:border-r-0",
        "[&>*:last-child]:border-b-0"
      )}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "group/pulse flex items-start gap-2.5 p-3.5 transition-ui hover:bg-muted/60",
            item.alert && "bg-danger-subtle/40 hover:bg-danger-subtle/60"
          )}
        >
          <item.icon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              item.alert ? "text-danger" : "text-muted-foreground"
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="label-annotation truncate">{item.label}</span>
              <ArrowRight className="size-3 shrink-0 text-faint opacity-0 transition-ui group-hover/pulse:opacity-100" />
            </div>
            <p
              className={cn(
                "mt-1 font-mono text-xl font-semibold leading-none tracking-tight",
                item.alert ? "text-danger" : "text-foreground"
              )}
            >
              {item.value}
            </p>
            <p className="mt-1.5 truncate text-xs text-muted-foreground">{item.detail}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Compact "today" chip for the dashboard hero. */
export function TodayChip({ date = new Date() }: { date?: Date }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
      <CalendarCheck className="size-3.5" />
      {new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(date)}
    </span>
  );
}
