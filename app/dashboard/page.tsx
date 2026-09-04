"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  DoorOpen,
  QrCode,
  Receipt,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Field, FieldList, Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  StatusBadge,
  derivePaymentStatus,
} from "@/components/ui/status-badge";
import { bookingApi, notificationApi, paymentApi } from "@/services/api";
import {
  daysUntil,
  formatCurrency,
  formatDate,
  formatRelativeDay,
  greeting,
} from "@/lib/format";
import type { BookingDetails, Notification, Payment } from "@/types";

/**
 * The resident's home.
 *
 * A student's questions are narrower than an operator's: where am I staying,
 * what do I owe, and is there anything I need to read? Those three, in that
 * order — with anything outstanding pulled to the top so it can be settled in
 * one tap on a phone (§27).
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePayNow = async (payment: Payment) => {
    setPayingId(payment.id);
    try {
      const { url } = await paymentApi.resumeCheckout(payment.id);
      window.location.href = url;
    } catch (error) {
      console.error("Error starting payment:", error);
      toast.error("Failed to start payment");
      setPayingId(null);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "STUDENT") {
      if (session.user.role === "SUPER_ADMIN") router.push("/super-admin");
      else if (session.user.role === "HOSTEL_ADMIN") router.push("/hostel-admin");
    }
  }, [status, router, session]);

  useEffect(() => {
    if (!session?.user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      const [bookingsResult, paymentsResult, notificationsResult] =
        await Promise.allSettled([
          bookingApi.getAll({ status: "ACTIVE" }),
          paymentApi.getAll(),
          notificationApi.getAll(),
        ]);

      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.data || []);
      if (paymentsResult.status === "fulfilled") setPayments(paymentsResult.value || []);
      if (notificationsResult.status === "fulfilled") {
        setNotifications(notificationsResult.value || []);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [session]);

  const currentBooking = useMemo(
    () =>
      bookings.find(
        (b) => new Date(b.checkIn) <= new Date() && new Date(b.checkOut) >= new Date()
      ),
    [bookings]
  );

  const outstanding = useMemo(
    () =>
      payments
        .map((p) => ({ payment: p, status: derivePaymentStatus(p) }))
        .filter(({ status }) => status === "PENDING" || status === "OVERDUE"),
    [payments]
  );

  const outstandingTotal = outstanding.reduce((s, { payment }) => s + payment.amount, 0);
  const paidTotal = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);
  const daysRemaining = currentBooking ? daysUntil(currentBooking.checkOut) ?? 0 : 0;
  const unread = notifications.filter((n) => !n.read);

  if (status === "loading") {
    return <LoadingSpinner fullPage message="Loading your dashboard…" />;
  }
  if (!session?.user) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${greeting()}, ${session.user.name?.split(" ")[0] ?? "there"}`}
        description={
          currentBooking
            ? `You're staying at ${currentBooking.room.hostel.name}.`
            : "You don't have an active stay right now."
        }
        action={
          <div className="flex flex-wrap gap-1.5">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/qr-code">
                <QrCode className="size-3.5" />
                Entry pass
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/payments">
                <CreditCard className="size-3.5" />
                Payments
              </Link>
            </Button>
            {/* Residents are still shoppers — browsing must always be one
                click away, not something you have to leave the console for. */}
            <Button asChild size="sm">
              <Link href="/hostels">
                <Search className="size-3.5" />
                Find a hostel
              </Link>
            </Button>
          </div>
        }
      />

      {/* Anything owed comes first — it is the only thing on this page that
          needs the resident to act. */}
      {outstanding.length > 0 && (
        <Panel className="border-warning-border bg-warning-subtle/40">
          <PanelHeader
            title={`${formatCurrency(outstandingTotal)} due`}
            description={`${outstanding.length} payment${
              outstanding.length === 1 ? "" : "s"
            } outstanding`}
            icon={Receipt}
          />
          <ul className="divide-y divide-border">
            {outstanding.slice(0, 3).map(({ payment, status }) => (
              <li key={payment.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {payment.description || "Hostel fee"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.dueDate ? `Due ${formatDate(payment.dueDate)}` : "No due date"}
                  </p>
                </div>
                <StatusBadge registry={PAYMENT_STATUS} value={status} size="sm" />
                <span className="font-mono text-sm font-medium">
                  {formatCurrency(payment.amount)}
                </span>
                <Button
                  size="xs"
                  onClick={() => handlePayNow(payment)}
                  disabled={payingId !== null}
                >
                  {payingId === payment.id ? (
                    <>
                      <BrandSpinner size="sm" />
                      Opening…
                    </>
                  ) : (
                    "Pay now"
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <MetricRow>
        <Metric
          label="Days remaining"
          value={currentBooking ? String(Math.max(0, daysRemaining)) : "—"}
          context={
            currentBooking
              ? `Stay ends ${formatDate(currentBooking.checkOut)}`
              : "No active stay"
          }
        />
        <Metric
          label="Outstanding"
          value={formatCurrency(outstandingTotal)}
          context={outstanding.length === 0 ? "You're all paid up" : "Awaiting payment"}
          emphasis={outstanding.length > 0 ? "alert" : "default"}
          href="/dashboard/payments"
        />
        <Metric label="Paid to date" value={formatCurrency(paidTotal)} context="All payments" />
        <Metric
          label="Unread notices"
          value={String(unread.length)}
          context={unread.length === 0 ? "Nothing new" : "Worth a look"}
        />
      </MetricRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Your stay"
            description="Where you're living right now"
            icon={DoorOpen}
            action={
              currentBooking ? (
                <Button asChild variant="ghost" size="xs">
                  <Link href={`/hostels/${currentBooking.room.hostel.id}`}>
                    View hostel
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              ) : undefined
            }
          />
          {loading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : currentBooking ? (
            <div className="p-3">
              <div className="mb-3 flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                  <Building2 className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {currentBooking.room.hostel.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentBooking.room.hostel.address}, {currentBooking.room.hostel.city},{" "}
                    {currentBooking.room.hostel.state} {currentBooking.room.hostel.zipCode}
                  </p>
                </div>
              </div>
              <FieldList>
                <Field label="Room">
                  <span className="identifier">{currentBooking.room.roomNumber}</span>
                </Field>
                <Field label="Room type">{currentBooking.room.roomType}</Field>
                <Field label="Checked in">{formatDate(currentBooking.checkIn)}</Field>
                <Field label="Checks out">{formatDate(currentBooking.checkOut)}</Field>
                <Field label="Rent">
                  {formatCurrency(currentBooking.room.price)} / month
                </Field>
                <Field label="Status">
                  <StatusBadge registry={BOOKING_STATUS} value={currentBooking.status} size="sm" />
                </Field>
              </FieldList>
            </div>
          ) : (
            <EmptyState
              icon={Building2}
              title="No active stay"
              description="Browse hostels and book a room to see your stay details here."
              actionLabel="Find a hostel"
              actionHref="/hostels"
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent updates"
            description="Notices and alerts for you"
            icon={Bell}
          />
          {loading ? (
            <div className="space-y-3 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              variant="inline"
              icon={Bell}
              title="Nothing new"
              description="Payment reminders and hostel notices will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="px-3 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                    <time className="shrink-0 text-xs text-faint">
                      {formatRelativeDay(n.createdAt)}
                    </time>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="All bookings"
          description="Every stay on your account"
          icon={CalendarDays}
          action={
            <Button asChild variant="ghost" size="xs">
              <Link href="/dashboard/bookings">View all</Link>
            </Button>
          }
        />
        {loading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={CalendarDays}
            title="No bookings yet"
            description="When you book a room it will be listed here."
            actionLabel="Find a hostel"
            actionHref="/hostels"
          />
        ) : (
          <ul className="divide-y divide-border">
            {bookings.slice(0, 5).map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/hostels/${booking.room.hostel.id}`}
                    className="truncate rounded-sm text-sm font-medium text-foreground underline-offset-4 transition-ui hover:text-primary hover:underline"
                  >
                    {booking.room.hostel.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Room <span className="identifier">{booking.room.roomNumber}</span> ·{" "}
                    {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                  </p>
                </div>
                <StatusBadge registry={BOOKING_STATUS} value={booking.status} size="sm" />
                <span className="font-mono text-sm">
                  {formatCurrency(booking.room.price)}
                  <span className="text-xs text-muted-foreground">/mo</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
