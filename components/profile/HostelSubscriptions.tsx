"use client";

import Link from "next/link";
import { Sparkles, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useFetch } from "@/hooks/use-fetch";
import { hostelAdminApi } from "@/services/api";

// Subscriptions are per-hostel, not per-user, so a hostel admin managing
// several hostels can be "Pro" on one and "Free" on another — this lists
// each hostel with its own status rather than a single ambiguous badge.
export function HostelSubscriptions() {
  const { data: hostels, loading } = useFetch(() => hostelAdminApi.getMySubscriptions(), []);

  if (loading || !hostels || hostels.length === 0) return null;

  return (
    <Panel>
      <PanelHeader
        title="Your hostels"
        description="Subscription status for each property you manage"
        icon={Building2}
        action={
          <Button asChild variant="ghost" size="xs">
            <Link href="/hostel-admin/billing">Manage billing</Link>
          </Button>
        }
      />
      <ul className="divide-y divide-border">
        {hostels.map((h) => {
          const isPro = h.accessLevel === "FULL";
          return (
            <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="truncate text-sm font-medium">{h.name}</span>
              {isPro ? (
                <Badge variant="warning" className="shrink-0">
                  <Sparkles className="size-3" />
                  Pro
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
    </Panel>
  );
}
