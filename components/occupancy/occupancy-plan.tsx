"use client";

import * as React from "react";
import { Building2, Layers } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  SLOT_LABEL,
  groupByFloor,
  type RoomLike,
  type RoomOccupancy,
  type SlotState,
} from "@/lib/occupancy";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * THE OCCUPANCY PLAN — the product's signature screen.
 *
 * Reads as an elevation drawing of the building: floors stack as horizontal
 * bands with the ground floor at the bottom, each room is a cell on its floor,
 * and each place in a room is a pip inside that cell. One glance answers "how
 * full am I, and where is the space?" — a question a table of room rows cannot
 * answer at all.
 *
 * Every pip is real: places come from Room.capacity and their state from the
 * bookings actually attached to the room (see lib/occupancy.ts). Because the
 * schema has no Bed model, pips are *positions*, not named beds — the UI never
 * claims a resident is in "204-B", only that 3 of 4 places are taken.
 */

const SLOT_CLASS: Record<SlotState, string> = {
  occupied: "bg-occupied",
  reserved: "bg-occupied/35 ring-1 ring-inset ring-occupied",
  available: "bg-transparent ring-1 ring-inset ring-available",
  maintenance: "bg-maintenance/40 ring-1 ring-inset ring-maintenance",
  blocked: "bg-inactive/30 ring-1 ring-inset ring-inactive",
};

/** Legend entries double as the key for the pip shapes, not just the colours. */
const LEGEND: { state: SlotState; label: string }[] = [
  { state: "occupied", label: "Occupied" },
  { state: "reserved", label: "Reserved" },
  { state: "available", label: "Available" },
  { state: "maintenance", label: "Maintenance" },
  { state: "blocked", label: "Blocked" },
];

export function OccupancyLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {LEGEND.map(({ state, label }) => (
        <li key={state} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("size-2.5 rounded-[2px]", SLOT_CLASS[state])} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function RoomCell({
  data,
  onSelect,
  selected,
}: {
  data: RoomOccupancy;
  onSelect?: (room: RoomOccupancy) => void;
  selected?: boolean;
}) {
  const { room, capacity, occupied, reserved, available, slots } = data;
  const full = available === 0 && capacity > 0;
  const outOfService = room.status === "MAINTENANCE" || room.status === "INACTIVE";

  // One sentence that fully describes the cell, so screen-reader users get the
  // same information the pips convey visually.
  const summary = outOfService
    ? `Room ${room.roomNumber}, ${capacity} places, ${
        room.status === "MAINTENANCE" ? "under maintenance" : "blocked"
      }`
    : `Room ${room.roomNumber}, ${occupied} of ${capacity} places occupied${
        reserved ? `, ${reserved} reserved` : ""
      }${available ? `, ${available} available` : ""}`;

  const Comp = onSelect ? "button" : "div";

  return (
    <Comp
      {...(onSelect
        ? { type: "button" as const, onClick: () => onSelect(data), "aria-label": summary }
        : { role: "group", "aria-label": summary })}
      title={summary}
      className={cn(
        "flex w-[5.75rem] flex-col gap-1.5 rounded-sm border p-1.5 text-left transition-ui",
        outOfService
          ? "border-dashed border-maintenance/50 bg-maintenance/[0.06]"
          : full
          ? "border-border bg-muted/50"
          : "border-border bg-card",
        onSelect &&
          "hover:border-primary hover:bg-primary-subtle/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary ring-2 ring-ring"
      )}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="identifier font-semibold text-foreground">{room.roomNumber}</span>
        <span className="text-2xs tabular-nums text-muted-foreground">
          {outOfService ? "—" : `${occupied}/${capacity}`}
        </span>
      </div>

      {/* The pips. Wrapping so a 12-bed dormitory stays inside the cell. */}
      <div className="flex flex-wrap gap-0.5">
        {slots.map((slot) => (
          <span
            key={slot.position}
            className={cn("size-2 rounded-[2px]", SLOT_CLASS[slot.state])}
            title={
              slot.occupant
                ? `${SLOT_LABEL[slot.state]} — ${slot.occupant.name}`
                : SLOT_LABEL[slot.state]
            }
          />
        ))}
        {capacity === 0 && <span className="text-2xs text-faint">No capacity set</span>}
      </div>
    </Comp>
  );
}

export function OccupancyPlan({
  rooms,
  loading = false,
  onSelectRoom,
  selectedRoomId,
  className,
}: {
  rooms: RoomLike[];
  loading?: boolean;
  onSelectRoom?: (room: RoomOccupancy) => void;
  selectedRoomId?: string | null;
  className?: string;
}) {
  const floors = React.useMemo(() => groupByFloor(rooms), [rooms]);

  if (loading) {
    return (
      <div className={cn("space-y-2 p-3", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-14 w-20 shrink-0 animate-pulse rounded-sm bg-muted" />
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="h-14 w-[5.75rem] animate-pulse rounded-sm bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No rooms mapped yet"
        description="Add rooms with their capacity and the floor plan will build itself from your bookings."
      />
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Floors are rendered top-down (highest first) so the plan reads like an
          elevation of the building rather than a list sorted by number. */}
      {floors.map((floor) => (
        <div
          key={floor.label}
          className="flex items-stretch gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
        >
          {/* Floor gutter — the annotation column of the drawing. */}
          <div className="flex w-24 shrink-0 flex-col justify-center border-r border-border pr-3">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 shrink-0 text-faint" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground">{floor.label}</span>
            </div>
            <span className="mt-0.5 text-2xs tabular-nums text-muted-foreground">
              {floor.occupied}/{floor.capacity} places
            </span>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-occupied transition-all duration-500"
                style={{ width: `${Math.min(100, floor.occupancyRate)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {floor.rooms.map((room) => (
              <RoomCell
                key={room.room.id}
                data={room}
                onSelect={onSelectRoom}
                selected={selectedRoomId === room.room.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact detail shown when a room cell is chosen, for use inside a drawer. */
export function RoomOccupancyDetail({ data }: { data: RoomOccupancy }) {
  const { room, slots, capacity, occupied, available } = data;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="identifier text-lg font-semibold text-foreground">
            Room {room.roomNumber}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.floorLabel} · {formatCurrency(room.price)} / month
          </p>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {occupied}/{capacity}
        </p>
      </div>

      <ul className="divide-y divide-border rounded-md border border-border">
        {slots.map((slot) => (
          <li key={slot.position} className="flex items-center gap-2.5 px-2.5 py-2">
            <span className={cn("size-2.5 shrink-0 rounded-[2px]", SLOT_CLASS[slot.state])} />
            <span className="w-16 shrink-0 text-xs text-muted-foreground">
              Place {slot.position}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {slot.occupant ? (
                slot.occupant.name
              ) : (
                <span className="text-muted-foreground">{SLOT_LABEL[slot.state]}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {available > 0 && (
        <p className="text-sm text-muted-foreground">
          {available} place{available === 1 ? "" : "s"} ready for allocation.
        </p>
      )}
    </div>
  );
}
