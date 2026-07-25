"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { StatusFilterSelect } from "@/components/common-in-admin/StatusFilterSelect";
import { PageHeader } from "@/components/layout/page-header";
import { bookingApi, roomApi } from "@/services/api";
import type { HostelRoom } from "@/services/api/room";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getBookingStatusColor } from "@/lib/status-colors";
import { BookingDetails } from "@/types";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

export default function HostelAdminBookingsPage() {
  const { hostel } = useMyHostel();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferTarget, setTransferTarget] = useState<BookingDetails | null>(null);
  const [renewTarget, setRenewTarget] = useState<BookingDetails | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = useCallback(async () => {
    if (!hostel) return;
    setLoading(true);
    try {
      const res = await bookingApi.getAll({ limit: 100, hostelId: hostel.id });
      setBookings(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [hostel]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  useEffect(() => {
    if (!hostel) return;
    roomApi
      .getByHostel(hostel.id)
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [hostel]);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage bookings, transfers, and renewals for your hostel" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>All Bookings</CardTitle>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows
                loading={loading}
                items={filteredBookings}
                colSpan={5}
                emptyTitle="No bookings yet"
                emptyDescription="Bookings for your hostel will show up here."
              >
                {(booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.user?.name || booking.user?.email}</TableCell>
                    <TableCell>{booking.room.roomType} — #{booking.room.roomNumber}</TableCell>
                    <TableCell>
                      {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
                    </TableCell>
                    <TableCell><Badge className={getBookingStatusColor(booking.status)}>{booking.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setTransferTarget(booking)}>
                            Transfer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRenewTarget(booking)}>
                            Renew
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableRows>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!transferTarget} onOpenChange={(open) => !open && setTransferTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move {transferTarget?.user?.name || "this student"} to a different room, keeping the same dates.
            </p>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms
                  .filter((r) => r.status === "AVAILABLE" && r.id !== transferTarget?.room.id)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.roomType} — #{r.roomNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleTransfer} disabled={busy || !selectedRoomId}>
              {busy ? "Transferring..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renewTarget} onOpenChange={(open) => !open && setRenewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renew Booking</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Label>New Check-out Date</Label>
            <Input type="date" value={newCheckOut} onChange={(e) => setNewCheckOut(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleRenew} disabled={busy || !newCheckOut}>
              {busy ? "Renewing..." : "Confirm Renewal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
