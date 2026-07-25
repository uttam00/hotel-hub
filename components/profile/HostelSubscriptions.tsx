"use client";

import Link from "next/link";
import { Sparkles, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFetch } from "@/hooks/use-fetch";
import { hostelAdminApi } from "@/services/api";

// Subscriptions are per-hostel, not per-user, so a hostel admin managing
// several hostels can be "Pro" on one and "Free" on another — this lists
// each hostel with its own status rather than a single ambiguous badge.
export function HostelSubscriptions() {
  const { data: hostels, loading } = useFetch(() => hostelAdminApi.getMySubscriptions(), []);

  if (loading || !hostels || hostels.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Hostels</CardTitle>
        <CardDescription>Subscription status for each hostel you manage</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {hostels.map((h) => {
            const isPro = h.accessLevel === "FULL";
            return (
              <li key={h.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{h.name}</span>
                </div>
                {isPro ? (
                  <Badge className="shrink-0 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    <Sparkles className="h-3 w-3" /> Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    Free
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
        <Link
          href="/hostel-admin/billing"
          className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          Manage billing
        </Link>
      </CardContent>
    </Card>
  );
}
