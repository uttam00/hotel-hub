"use client";

import { Metric } from "@/components/ui/metric";
import { RevenueAnalytics } from "@/components/analytics/revenue-analytics";
import { analyticsApi } from "@/services/api";
import { formatNumber } from "@/lib/format";

export default function PlatformAnalyticsPage() {
  return (
    <RevenueAnalytics
      fetcher={() => analyticsApi.getPlatformAnalytics()}
      title="Platform analytics"
      description="How HostelHub is performing across every hostel"
      chartTitle="Platform collections"
      chartDescription="Completed booking payments across every hostel, last six months"
      extraCards={(data) => (
        <Metric
          label="Active subscriptions"
          value={formatNumber(data.activeSubscriptions ?? 0)}
          context="Properties paying for HostelHub"
        />
      )}
    />
  );
}
