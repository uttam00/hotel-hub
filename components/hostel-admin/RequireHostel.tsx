"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useHostelContext } from "@/contexts/hostel-context";

/**
 * Guards the hostel-admin console against having no property to manage.
 *
 * Almost every page here is scoped to a hostel, so with none assigned they all
 * fetch nothing. Previously that surfaced as a table stuck in its loading state
 * forever; now it says what is actually wrong and offers the one action that
 * fixes it.
 *
 * These routes stay reachable without a hostel, because they are how you get
 * one (or manage the account behind it).
 */
const WORKS_WITHOUT_HOSTEL = ["/hostel-admin/hostels"];

export function RequireHostel({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hostels, loading } = useHostelContext();

  const exempt = WORKS_WITHOUT_HOSTEL.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`)
  );
  if (exempt) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (hostels.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={Building2}
          title="No hostel yet"
          description="Everything in this console — residents, occupancy, payments — belongs to a property. Add yours to get started, or ask your administrator to assign you one."
          actionLabel="Add your hostel"
          actionHref="/hostel-admin/hostels/new"
        />
      </Panel>
    );
  }

  return <>{children}</>;
}
