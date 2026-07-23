"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueAnalytics } from "@/components/analytics/revenue-analytics";
import { analyticsApi } from "@/services/api";

export default function PlatformAnalyticsPage() {
  return (
    <RevenueAnalytics
      fetcher={() => analyticsApi.getPlatformAnalytics()}
      title="Platform Analytics"
      description="How HostelHub is performing across every hostel"
      gridClassName="md:grid-cols-4"
      maxFunnelCards={2}
      showOccupancyDetail={false}
      chartTitle="Platform Revenue (last 6 months)"
      chartDescription="Completed booking payments across every hostel"
      loadingMessage="Loading platform analytics..."
      extraCards={(data) => (
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-2xl">{data.activeSubscriptions}</CardTitle>
          </CardHeader>
        </Card>
      )}
    />
  );
}
