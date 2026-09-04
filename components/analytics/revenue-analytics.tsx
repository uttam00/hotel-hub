"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Metric, MetricRow } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { BOOKING_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { useFetch } from "@/hooks/use-fetch";
import { formatCurrency, formatCurrencyCompact, formatPercent } from "@/lib/format";
import { TrendingUp } from "lucide-react";

export type Analytics = {
  occupancy: { total: number; occupied: number; rate: number };
  bookingFunnel: { status: string; count: number }[];
  revenueTrend: { month: string; total: number }[];
  activeSubscriptions?: number;
};

/** "2026-09" -> "Sep". Axis labels only need the month; the year is implied. */
function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const [year, month] = String(label).split("-").map(Number);
  const full =
    year && month
      ? new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : label;
  return (
    <div className="rounded-md border border-border-strong bg-popover px-2.5 py-1.5 shadow-overlay">
      <p className="text-xs text-muted-foreground">{full}</p>
      <p className="font-mono text-sm font-semibold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/**
 * Monthly collections. One series, so no legend — the panel title names it.
 * The most recent month is drawn in full brand ink and the earlier ones are
 * held back, because "how are we doing *now*" is the question being asked.
 */
export function RevenueTrendChart({
  data,
  height = 200,
}: {
  data: { month: string; total: number }[];
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon={TrendingUp}
        title="No collections yet"
        description="Once payments start arriving, the monthly trend appears here."
      />
    );
  }

  const lastIndex = data.length - 1;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
          {/* Horizontal rules only — vertical grid lines add nothing to a
              categorical axis and compete with the bars. */}
          <CartesianGrid
            horizontal
            vertical={false}
            stroke="hsl(var(--border))"
            strokeDasharray="2 3"
          />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickFormatter={(v) => formatCurrencyCompact(v)}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey="total" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === lastIndex ? "hsl(var(--chart-1))" : "hsl(var(--chart-1) / 0.4)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RevenueAnalyticsProps {
  fetcher: (() => Promise<Analytics>) | null;
  title: string;
  description: string;
  chartTitle: string;
  chartDescription?: string;
  /** Extra metrics appended to the KPI row. */
  extraCards?: (data: Analytics) => ReactNode;
  loadingMessage?: string;
  /** Retained for call-site compatibility; layout is now responsive by default. */
  gridClassName?: string;
  maxFunnelCards?: number;
  showOccupancyDetail?: boolean;
}

/**
 * The shared analytics page for hostel admins and super admins.
 *
 * Every figure answers an operational question (§30): how full am I, how much
 * came in, how much is stuck in unconfirmed bookings. The booking funnel is a
 * labelled list rather than a pie — five statuses in a pie is unreadable, and
 * the statuses already have a defined badge vocabulary.
 */
export function RevenueAnalytics({
  fetcher,
  title,
  description,
  chartTitle,
  chartDescription,
  extraCards,
}: RevenueAnalyticsProps) {
  const { data, loading } = useFetch(fetcher);

  const trend = data?.revenueTrend ?? [];
  const thisMonth = trend.at(-1)?.total ?? 0;
  const lastMonth = trend.at(-2)?.total ?? 0;
  const trendPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
  const totalBookings = (data?.bookingFunnel ?? []).reduce((s, f) => s + f.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>

      <MetricRow>
        <Metric
          label="Occupancy"
          value={loading ? "—" : formatPercent(data?.occupancy.rate ?? 0, 0)}
          context={
            data ? `${data.occupancy.occupied} of ${data.occupancy.total} rooms occupied` : undefined
          }
          meter={{ pct: data?.occupancy.rate ?? 0 }}
        />
        <Metric
          label="Collected this month"
          value={loading ? "—" : formatCurrencyCompact(thisMonth)}
          context={lastMonth > 0 ? `${formatCurrency(lastMonth)} last month` : "First month"}
          trend={trendPct != null ? { value: trendPct, label: "vs last month" } : undefined}
        />
        <Metric
          label="Bookings"
          value={loading ? "—" : String(totalBookings)}
          context="All time"
        />
        {data && extraCards?.(data)}
      </MetricRow>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title={chartTitle} description={chartDescription} />
          <div className="p-3">
            <RevenueTrendChart data={trend} height={280} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Bookings by status" description="Where stays currently sit" />
          {(data?.bookingFunnel ?? []).length === 0 ? (
            <EmptyState
              variant="inline"
              title="No bookings yet"
              description="Booking activity will be broken down here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data!.bookingFunnel.map((f) => {
                const pct = totalBookings > 0 ? (f.count / totalBookings) * 100 : 0;
                return (
                  <li key={f.status} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge registry={BOOKING_STATUS} value={f.status} size="sm" />
                      <span className="font-mono text-sm text-foreground">{f.count}</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-1"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
