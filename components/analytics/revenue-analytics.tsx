"use client";

import type { ReactNode } from "react";
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFetch } from "@/hooks/use-fetch";

export type Analytics = {
  occupancy: { total: number; occupied: number; rate: number };
  bookingFunnel: { status: string; count: number }[];
  revenueTrend: { month: string; total: number }[];
  activeSubscriptions?: number;
};

interface RevenueAnalyticsProps {
  fetcher: (() => Promise<Analytics>) | null;
  title: string;
  description: string;
  gridClassName: string;
  maxFunnelCards?: number;
  showOccupancyDetail?: boolean;
  chartTitle: string;
  chartDescription?: string;
  extraCards?: (data: Analytics) => ReactNode;
  loadingMessage: string;
}

export function RevenueAnalytics({
  fetcher,
  title,
  description,
  gridClassName,
  maxFunnelCards,
  showOccupancyDetail = true,
  chartTitle,
  chartDescription,
  extraCards,
  loadingMessage,
}: RevenueAnalyticsProps) {
  const { data } = useFetch(fetcher);

  if (!data) return <LoadingSpinner fullPage message={loadingMessage} />;

  const funnel = maxFunnelCards ? data.bookingFunnel.slice(0, maxFunnelCards) : data.bookingFunnel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className={`grid gap-4 ${gridClassName}`}>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Occupancy Rate</CardDescription>
            <CardTitle className="text-2xl">{data.occupancy.rate}%</CardTitle>
          </CardHeader>
          {showOccupancyDetail && (
            <CardContent className="text-sm text-muted-foreground">
              {data.occupancy.occupied} of {data.occupancy.total} rooms occupied
            </CardContent>
          )}
        </Card>
        {extraCards?.(data)}
        {funnel.map((f) => (
          <Card key={f.status}>
            <CardHeader className="pb-2">
              <CardDescription>{f.status} Bookings</CardDescription>
              <CardTitle className="text-2xl">{f.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
          {chartDescription && <CardDescription>{chartDescription}</CardDescription>}
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: number) => [`₹${value.toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
