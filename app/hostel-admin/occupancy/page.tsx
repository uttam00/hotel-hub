"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, LayoutGrid, Rows3, Table2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { ROOM_STATUS, ROOM_TYPE, StatusBadge } from "@/components/ui/status-badge";
import {
  OccupancyLegend,
  OccupancyPlan,
  RoomOccupancyDetail,
} from "@/components/occupancy/occupancy-plan";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { roomApi } from "@/services/api";
import { groupByFloor, summarise, type RoomOccupancy } from "@/lib/occupancy";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type View = "plan" | "grid" | "table";

/**
 * The Occupancy page — the property's home screen.
 *
 * Three views over one dataset (§12): the plan for spatial understanding, the
 * grid for scanning availability, and the table for operational detail. All
 * three read from the same derivation, so they cannot disagree.
 */
export default function OccupancyPage() {
  const { hostel } = useMyHostel();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("plan");
  const [selected, setSelected] = useState<RoomOccupancy | null>(null);

  const { data: rooms, loading } = useFetch(
    hostel ? () => roomApi.getByHostel(hostel.id) : null,
    [hostel]
  );

  const summary = useMemo(() => summarise(rooms ?? []), [rooms]);
  const floors = useMemo(() => groupByFloor(rooms ?? []), [rooms]);
  const allRooms = useMemo(() => floors.flatMap((f) => f.rooms), [floors]);

  // Deep link from the command palette: /hostel-admin/occupancy?room=<id>
  const roomParam = searchParams.get("room");
  useEffect(() => {
    if (!roomParam || allRooms.length === 0) return;
    const match = allRooms.find((r) => r.room.id === roomParam);
    if (match) setSelected(match);
  }, [roomParam, allRooms]);

  const views: { id: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "plan", label: "Plan", icon: Rows3 },
    { id: "grid", label: "Grid", icon: LayoutGrid },
    { id: "table", label: "Table", icon: Table2 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Occupancy plan"
        description="Every floor, room and place in the building"
        breadcrumbs={[
          { label: "Property" },
          { label: hostel?.name ?? "Hostel", href: "/hostel-admin/hostels" },
          { label: "Occupancy" },
        ]}
        action={
          <div className="flex items-center gap-0.5 rounded-sm border border-border bg-card p-0.5">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-sm transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view === v.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <v.icon className="size-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        }
      />

      <MetricRow>
        <Metric
          label="Occupancy"
          value={formatPercent(summary.occupancyRate)}
          context={`${summary.occupied + summary.reserved} of ${
            summary.totalCapacity - summary.outOfService
          } places taken`}
          meter={{ pct: summary.occupancyRate }}
        />
        <Metric
          label="Available now"
          value={formatNumber(summary.available)}
          context={`across ${summary.totalRooms} rooms`}
        />
        <Metric
          label="Reserved"
          value={formatNumber(summary.reserved)}
          context="confirmed, not yet arrived"
        />
        <Metric
          label="Out of service"
          value={formatNumber(summary.outOfService)}
          context="maintenance or blocked"
          emphasis={summary.outOfService > 0 ? "alert" : "default"}
        />
      </MetricRow>

      <Panel>
        <PanelHeader
          title={
            view === "plan" ? "Building elevation" : view === "grid" ? "Rooms" : "Room register"
          }
          description={
            view === "plan"
              ? "Highest floor first, as the building stands"
              : view === "grid"
              ? "Every room and its free places"
              : "Full detail for operational work"
          }
          icon={Building2}
          action={view !== "table" ? <OccupancyLegend /> : undefined}
        />

        {view === "plan" && (
          <OccupancyPlan
            rooms={rooms ?? []}
            loading={loading}
            onSelectRoom={setSelected}
            selectedRoomId={selected?.room.id ?? null}
          />
        )}

        {view === "grid" && <RoomGrid rooms={allRooms} loading={loading} onSelect={setSelected} />}

        {view === "table" && <RoomTable rooms={allRooms} loading={loading} onSelect={setSelected} />}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Room detail</SheetTitle>
          </SheetHeader>
          <SheetBody>{selected && <RoomOccupancyDetail data={selected} />}</SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoomGrid({
  rooms,
  loading,
  onSelect,
}: {
  rooms: RoomOccupancy[];
  loading: boolean;
  onSelect: (room: RoomOccupancy) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-sm bg-muted" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No rooms yet"
        description="Add rooms with their capacity and this grid fills itself in."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
      {rooms.map((data) => (
        <button
          key={data.room.id}
          type="button"
          onClick={() => onSelect(data)}
          className="flex flex-col gap-1.5 rounded-sm border border-border bg-card p-2.5 text-left transition-ui hover:border-primary hover:bg-primary-subtle/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="identifier font-semibold">{data.room.roomNumber}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {data.occupied}/{data.capacity}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{data.floorLabel}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <StatusBadge registry={ROOM_STATUS} value={data.room.status} size="sm" />
            {data.available > 0 && (
              <span className="text-2xs font-medium text-available">{data.available} free</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function RoomTable({
  rooms,
  loading,
  onSelect,
}: {
  rooms: RoomOccupancy[];
  loading: boolean;
  onSelect: (room: RoomOccupancy) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-sm bg-muted" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No rooms yet"
        description="Rooms you add to this hostel will be listed here."
      />
    );
  }

  return (
    <TableScroller maxHeight="60vh">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Room</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Type</TableHead>
            <TableHead numeric>Capacity</TableHead>
            <TableHead numeric>Occupied</TableHead>
            <TableHead numeric>Free</TableHead>
            <TableHead numeric>Rent</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((data) => (
            <TableRow
              key={data.room.id}
              onClick={() => onSelect(data)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(data);
                }
              }}
              className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <TableCell className="identifier font-medium">{data.room.roomNumber}</TableCell>
              <TableCell className="text-muted-foreground">{data.floorLabel}</TableCell>
              <TableCell>
                <StatusBadge registry={ROOM_TYPE} value={data.room.roomType} size="sm" showIcon={false} />
              </TableCell>
              <TableCell numeric>{data.capacity}</TableCell>
              <TableCell numeric>{data.occupied}</TableCell>
              <TableCell numeric className={data.available > 0 ? "text-available" : undefined}>
                {data.available}
              </TableCell>
              <TableCell numeric>{formatCurrency(data.room.price)}</TableCell>
              <TableCell>
                <StatusBadge registry={ROOM_STATUS} value={data.room.status} size="sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScroller>
  );
}
