"use client";

import { RevenueAnalytics } from "@/components/analytics/revenue-analytics";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { analyticsApi } from "@/services/api";

export default function HostelAnalyticsPage() {
  const { hostel } = useMyHostel();

  return (
    <RevenueAnalytics
      fetcher={hostel ? () => analyticsApi.getHostelAnalytics(hostel.id) : null}
      title="Analytics"
      description="How your hostel is performing"
      chartTitle="Monthly collections"
      chartDescription="Completed payments over the last six months"
    />
  );
}
