"use client";

import { RevenueAnalytics } from "@/components/analytics/revenue-analytics";
import { useMyHostel } from "@/hooks/use-my-hostel";

export default function HostelAnalyticsPage() {
  const { hostel } = useMyHostel();

  return (
    <RevenueAnalytics
      fetchUrl={hostel ? `/api/hostel-admin/analytics?hostelId=${hostel.id}` : null}
      title="Analytics"
      description="How your hostel is performing"
      gridClassName="md:grid-cols-3"
      chartTitle="Revenue (last 6 months)"
      loadingMessage="Loading analytics..."
    />
  );
}
