"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, CalendarPlus, ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { ActiveFilters, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { BOOKING_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { bookingApi, roomApi } from "@/services/api";
import type { HostelRoom } from "@/services/api/room";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { deriveRoomOccupancy } from "@/lib/occupancy";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BookingDetails } from "@/types";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Checked out" },
];

/** Same-day comparison in local time, matching how the stats API buckets today. */
function isToday(value: string | Date): boolean {
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function HostelAdminBookingsPage() {
  const { hostel } = useMyHostel();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const [transferTarget, setTransferTarget] = useState<BookingDetails | null>(null);
  const [renewTarget, setRenewTarget] = useState<BookingDetails | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [busy, setBusy] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  // The dashboard's pulse links here with ?filter=arrivals / departures.
  const [dayFilter, setDayFilter] = useState(searchParams.get("filter") ?? "ALL");

  const fetchBookings = useCallback(async () => {
    if (!hostel) return;
    setLoading(true);
    try {
      const res = await bookingApi.getAll({ limit: 200, hostelId: hostel.id });
      setBookings(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [hostel]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!hostel) return;
    roomApi
      .getByHostel(hostel.id)
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [hostel]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (dayFilter === "arrivals" && !isToday(b.checkIn)) return false;
      if (dayFilter === "departures" && !isToday(b.checkOut)) return false;
      if (!query) return true;
      return [b.user?.name, b.user?.email, b.room.roomNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [bookings, statusFilter, dayFilter, search]);

  const activeFilterCount = (statusFilter !== "ALL" ? 1 : 0) + (dayFilter !== "ALL" ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setDayFilter("ALL");
  };

  const handleTransfer = async () => {
    if (!transferTarget || !selectedRoomId) return;
    setBusy(true);
    try {
      await bookingApi.transfer(transferTarget.id, selectedRoomId);
      toast.success("Room transferred");
      setTransferTarget(null);
      setSelectedRoomId("");
      fetchBookings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = async () => {
    if (!renewTarget || !newCheckOut) return;
    setBusy(true);
    try {
      await bookingApi.update(renewTarget.id, { checkOut: newCheckOut });
      toast.success("Booking renewed");
      setRenewTarget(null);
      setNewCheckOut("");
      fetchBookings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Renewal failed");
    } finally {
      setBusy(false);
    }
  };

  // Rooms that can actually take the resident: not the current room, and with a
  // free place. Showing full rooms in the list only invites a failed transfer.
  const transferOptions = useMemo(() => {
    return rooms
      .map((r) => ({ room: r, occ: deriveRoomOccupancy(r) }))
      .filter(
        ({ room, occ }) =>
          room.id !== transferTarget?.room.id &&
          room.status !== "MAINTENANCE" &&
          room.status !== "INACTIVE" &&
          occ.available > 0
      );
  }, [rooms, transferTarget]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Bookings"
        description="Check-ins, check-outs, transfers and renewals"
        breadcrumbs={[{ label: "Residents" }, { label: "Bookings" }]}
      />

      <Panel>
        <PanelHeader
          title={
            dayFilter === "arrivals"
              ? "Arriving today"
              : dayFilter === "departures"
              ? "Leaving today"
              : "All bookings"
          }
          description={loading ? "Loading…" : `${filtered.length} shown`}
          icon={ClipboardList}
        />

        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Resident or room…"
            className="w-full sm:w-56"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[8.5rem]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[8.5rem]" aria-label="Filter by day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any date</SelectItem>
              <SelectItem value="arrivals">Arriving today</SelectItem>
              <SelectItem value="departures">Leaving today</SelectItem>
            </SelectContent>
          </Select>

          <ActiveFilters count={activeFilterCount} onClear={clearFilters} />
        </Toolbar>

        {loading ? (
          <SkeletonTable rows={8} columns={5} />
        ) : filtered.length === 0 ? (
          bookings.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No bookings yet"
              description="When students book a room at your hostel, their stays will be listed here."
            />
          ) : dayFilter === "arrivals" ? (
            <EmptyState
              icon={ClipboardList}
              title="No arrivals today"
              description="Nobody is scheduled to check in. Enjoy the quiet."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Show all bookings
              </Button>
            </EmptyState>
          ) : dayFilter === "departures" ? (
            <EmptyState
              icon={ClipboardList}
              title="No departures today"
              description="No rooms are freeing up today."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Show all bookings
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No bookings match these filters"
              description="Try a different status or date, or clear the filters."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 22rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((booking) => {
                  const actionable =
                    booking.status === "PENDING" || booking.status === "CONFIRMED";
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.user?.name || booking.user?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <span className="identifier">{booking.room.roomNumber}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {booking.room.roomType}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(booking.checkIn)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(booking.checkOut)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge registry={BOOKING_STATUS} value={booking.status} size="sm" />
                      </TableCell>
                      <TableCell numeric>{formatCurrency(booking.totalPrice)}</TableCell>
                      <TableCell className="text-right">
                        {actionable && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setTransferTarget(booking)}
                            >
                              <ArrowLeftRight className="size-3" />
                              Transfer
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setRenewTarget(booking)}
                            >
                              <CalendarPlus className="size-3" />
                              Renew
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>

      {/* ---------- Transfer drawer ---------- */}
      <Sheet
        open={!!transferTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null);
            setSelectedRoomId("");
          }
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Transfer room</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move {transferTarget?.user?.name || "this resident"} out of room{" "}
              <span className="identifier text-foreground">
                {transferTarget?.room.roomNumber}
              </span>{" "}
              into another room, keeping the same dates.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-room">New room</Label>
              {transferOptions.length === 0 ? (
                <p className="rounded-sm border border-warning-border bg-warning-subtle px-2.5 py-2 text-sm">
                  No other room has a free place right now.
                </p>
              ) : (
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger id="transfer-room">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferOptions.map(({ room, occ }) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber} · {room.roomType} · {occ.available} free
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setTransferTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={busy || !selectedRoomId}>
              {busy ? "Transferring…" : "Confirm transfer"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ---------- Renew drawer ---------- */}
      <Sheet
        open={!!renewTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenewTarget(null);
            setNewCheckOut("");
          }
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Renew booking</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Extend {renewTarget?.user?.name || "this resident"}&apos;s stay in room{" "}
              <span className="identifier text-foreground">{renewTarget?.room.roomNumber}</span>.
              Currently ends {renewTarget ? formatDate(renewTarget.checkOut) : "—"}.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="renew-date">New check-out date</Label>
              <Input
                id="renew-date"
                type="date"
                value={newCheckOut}
                // Can't renew to a date before the stay already ends.
                min={
                  renewTarget
                    ? new Date(renewTarget.checkOut).toISOString().slice(0, 10)
                    : undefined
                }
                onChange={(e) => setNewCheckOut(e.target.value)}
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setRenewTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenew} disabled={busy || !newCheckOut}>
              {busy ? "Renewing…" : "Confirm renewal"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
