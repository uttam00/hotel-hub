"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { BOOKING_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { bookingApi } from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BookingDetails } from "@/types";

export default function StudentBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    bookingApi
      .getAll({})
      .then((response) => setBookings(response.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="My bookings"
        description="Every stay on your account"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Bookings" }]}
      />

      <Panel>
        <PanelHeader
          title="Stays"
          description={loading ? "Loading…" : `${bookings.length} on record`}
          icon={CalendarDays}
        />

        {status === "loading" || loading ? (
          <SkeletonTable rows={4} columns={5} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No bookings yet"
            description="Browse hostels to find a room — your stays will be listed here once booked."
            actionLabel="Browse hostels"
            actionHref="/hostels"
          />
        ) : (
          <TableScroller>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {booking.room?.hostel?.name || "Hostel booking"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {booking.room?.hostel?.city}, {booking.room?.hostel?.state}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="identifier">{booking.room?.roomNumber}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {booking.room?.roomType}
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
                    <TableCell numeric className="font-medium">
                      {formatCurrency(booking.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>
    </div>
  );
}
