"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Building2,
  DoorOpen,
  Megaphone,
  Plus,
  Receipt,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  OccupancyLegend,
  OccupancyPlan,
  RoomOccupancyDetail,
} from "@/components/occupancy/occupancy-plan";
import { OperationsPulse, TodayChip } from "@/components/hostel-admin/OperationsPulse";
import { RevenueTrendChart } from "@/components/analytics/revenue-analytics";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { hostelAdminApi, roomApi, analyticsApi } from "@/services/api";
import { summarise, type RoomOccupancy } from "@/lib/occupancy";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
  greeting,
} from "@/lib/format";

/**
 * THE COMMAND CENTER.
 *
 * Answers "what is happening in my hostel right now?" in the order the question
 * is actually asked: today's obligations first (Operations Pulse), then the
 * health of the business (metrics), then where the space is (Occupancy Plan),
 * then the trend.
 *
 * Replaces the previous six identical count cards, which reported how many rows
 * existed in each table — information nobody running a hostel needs.
 */
export function HostelAdminDashboardStats() {
  const { data: session } = useSession();
  const { hostel, loading: hostelLoading } = useMyHostel();
  const [selectedRoom, setSelectedRoom] = useState<RoomOccupancy | null>(null);

  const { data: stats, loading: statsLoading } = useFetch(
    hostel ? () => hostelAdminApi.getStats(hostel.id) : null,
    [hostel]
  );
  const { data: rooms, loading: roomsLoading } = useFetch(
    hostel ? () => roomApi.getByHostel(hostel.id) : null,
    [hostel]
  );
  const { data: analytics } = useFetch(
    hostel ? () => analyticsApi.getHostelAnalytics(hostel.id) : null,
    [hostel]
  );

  // Occupancy is derived from rooms + bookings rather than read from the stats
  // endpoint, so the dashboard and the occupancy page can never disagree.
  const occupancy = useMemo(() => summarise(rooms ?? []), [rooms]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (hostelLoading) {
    return <DashboardSkeleton />;
  }

  if (!hostel) {
    return (
      <EmptyState
        icon={Building2}
        title="No property assigned yet"
        description="Once a hostel is assigned to your account, its occupancy, residents and collections will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Hero ---------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across {hostel.name} today.
          </p>
          <div className="mt-2">
            <TodayChip />
          </div>
        </div>

        {/* Quick actions — reachable without dominating the screen (§9). */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button asChild size="sm" variant="outline">
            <Link href="/hostel-admin/payments">
              <Receipt className="size-3.5" />
              Record payment
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/hostel-admin/notices">
              <Megaphone className="size-3.5" />
              Post notice
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/hostel-admin/occupancy">
              <Plus className="size-3.5" />
              Allocate a bed
            </Link>
          </Button>
        </div>
      </div>

      {/* ---------- Operations pulse ---------- */}
      <section aria-labelledby="pulse-heading">
        <h2 id="pulse-heading" className="sr-only">
          Today&apos;s operations
        </h2>
        <OperationsPulse
          arrivalsToday={stats?.arrivalsToday ?? 0}
          departuresToday={stats?.departuresToday ?? 0}
          overdueCount={stats?.overdueCount ?? 0}
          overdueAmount={stats?.overdueAmount ?? 0}
          visitorsOnPremises={stats?.visitorsOnPremises ?? 0}
          loading={statsLoading}
        />
      </section>

      {/* ---------- Health metrics ---------- */}
      <section aria-labelledby="health-heading">
        <h2 id="health-heading" className="sr-only">
          Hostel health
        </h2>
        <MetricRow>
          <Metric
            label="Occupancy"
            value={roomsLoading ? "—" : formatPercent(occupancy.occupancyRate)}
            context={
              roomsLoading
                ? "Loading rooms"
                : `${occupancy.occupied + occupancy.reserved} of ${
                    occupancy.totalCapacity - occupancy.outOfService
                  } places taken`
            }
            meter={{
              pct: occupancy.occupancyRate,
              tone: occupancy.occupancyRate >= 85 ? "success" : "brand",
            }}
            href="/hostel-admin/occupancy"
          />
          <Metric
            label="Collected this month"
            value={formatCurrencyCompact(stats?.collectedThisMonth ?? 0)}
            context={`${formatCurrency(stats?.collectedToday ?? 0)} today`}
            trend={
              stats?.collectionTrendPct != null
                ? { value: stats.collectionTrendPct, label: "vs last month", goodDirection: "up" }
                : undefined
            }
            href="/hostel-admin/payments"
          />
          <Metric
            label="Outstanding dues"
            value={formatCurrencyCompact(stats?.outstandingAmount ?? 0)}
            context={
              stats && stats.overdueCount > 0
                ? `${stats.overdueCount} overdue · ${stats.outstandingCount} total`
                : `${stats?.outstandingCount ?? 0} awaiting payment`
            }
            emphasis={stats && stats.overdueCount > 0 ? "alert" : "default"}
            href="/hostel-admin/payments?status=PENDING"
          />
          <Metric
            label="Residents"
            value={formatNumber(stats?.totalStudents ?? 0)}
            context={`${formatNumber(stats?.totalRooms ?? 0)} rooms${
              stats && stats.waitlistWaiting > 0
                ? ` · ${stats.waitlistWaiting} waiting`
                : ""
            }`}
            href="/hostel-admin/students"
          />
        </MetricRow>
      </section>

      {/* ---------- Occupancy plan + trend ---------- */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Occupancy plan"
            description="Floors, rooms and every place in them"
            icon={DoorOpen}
            action={
              <Button asChild variant="ghost" size="xs">
                <Link href="/hostel-admin/occupancy">
                  Open plan
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            }
          />
          <div className="border-b border-border px-3 py-2">
            <OccupancyLegend />
          </div>
          <OccupancyPlan
            rooms={rooms ?? []}
            loading={roomsLoading}
            onSelectRoom={setSelectedRoom}
            selectedRoomId={selectedRoom?.room.id ?? null}
          />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader title="Collections" description="Last 6 months" icon={Receipt} />
            <div className="p-3">
              <RevenueTrendChart data={analytics?.revenueTrend ?? []} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="This month" icon={Users} />
            <dl className="divide-y divide-border">
              <MoneyRow label="Collected" value={stats?.collectedThisMonth ?? 0} />
              <MoneyRow label="Expenses" value={stats?.expensesThisMonth ?? 0} negative />
              <MoneyRow label="Net" value={stats?.netThisMonth ?? 0} emphasis />
            </dl>
          </Panel>
        </div>
      </div>

      {/* Room detail opens in a drawer so the plan stays visible behind it. */}
      <Sheet open={!!selectedRoom} onOpenChange={(o) => !o && setSelectedRoom(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Room detail</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {selectedRoom && <RoomOccupancyDetail data={selectedRoom} />}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  negative = false,
  emphasis = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasis
            ? `font-mono text-sm font-semibold ${value < 0 ? "text-danger" : "text-success"}`
            : "font-mono text-sm text-foreground"
        }
      >
        {negative && value > 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </dd>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-14 w-72 animate-pulse rounded-sm bg-muted" />
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
