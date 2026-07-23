"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { bookingApi, paymentApi, notificationApi } from "@/services/api";
import { BookingDetails, Payment, Notification } from "@/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
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
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "STUDENT"
    ) {
      // Redirect non-student users to their appropriate dashboard
      if (session.user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      } else if (session.user.role === "HOSTEL_ADMIN") {
        router.push("/hostel-admin/hostels");
      }
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [bookingsResult, paymentsResult, notificationsResult] =
          await Promise.allSettled([
            bookingApi.getAll({ status: "ACTIVE" }),
            paymentApi.getAll(),
            notificationApi.getAll(),
          ]);

        if (bookingsResult.status === "fulfilled") {
          setBookings(bookingsResult.value.data || []);
        }
        if (paymentsResult.status === "fulfilled") {
          setPayments(paymentsResult.value || []);
        }
        if (notificationsResult.status === "fulfilled") {
          setNotifications(notificationsResult.value || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load some dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  // Calculate dashboard metrics
  const activeBookings = bookings.filter(
    (booking) =>
      new Date(booking.checkIn) <= new Date() &&
      new Date(booking.checkOut) >= new Date()
  );
  const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const currentBooking = activeBookings[0];
  const daysRemaining = currentBooking
    ? Math.ceil(
        (new Date(currentBooking.checkOut).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  if (status === "loading" || loading) {
    return <LoadingSpinner fullPage message="Loading your dashboard..." />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}!
        </p>
      </div>
      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-none md:flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Current Bookings</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
        </TabsList>
        <div className="flex gap-2 mt-2">
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="h-3 w-3" />
              All Bookings
            </Button>
          </Link>
          <Link href="/dashboard/payments">
            <Button variant="outline" size="sm" className="gap-1">
              <CreditCard className="h-3 w-3" />
              All Payments
            </Button>
          </Link>
        </div>
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Bookings
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : activeBookings.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current active bookings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `$${totalSpent.toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total payments made
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Days Remaining
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : daysRemaining}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current booking period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Notifications
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : unreadNotifications.length}
                </div>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Current Hostel</CardTitle>
                <CardDescription>
                  Your current accommodation details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    <div className="aspect-video w-full animate-pulse bg-muted rounded-md" />
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ) : currentBooking ? (
                  <>
                    <div className="aspect-video w-full bg-muted relative rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {currentBooking.room.hostel.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentBooking.room.hostel.address},{" "}
                        {currentBooking.room.hostel.city},{" "}
                        {currentBooking.room.hostel.state}{" "}
                        {currentBooking.room.hostel.zipCode}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Room Number</p>
                        <p className="text-sm text-muted-foreground">
                          {currentBooking.room.roomNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Room Type</p>
                        <p className="text-sm text-muted-foreground">
                          {currentBooking.room.roomType}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Check-in Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            currentBooking.checkIn
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Check-out Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            currentBooking.checkOut
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/bookings/${currentBooking.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active bookings</p>
                    <Button className="mt-4" asChild>
                      <Link href="/hostels">Find a Hostel</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest notifications and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.slice(0, 4).map((notification) => (
                      <div
                        key={notification.id}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No recent activity
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="bookings" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Bookings</CardTitle>
              <CardDescription>
                View and manage your active hostel bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <h3 className="font-semibold">
                            {booking.room.hostel.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Room {booking.room.roomNumber},{" "}
                            {booking.room.roomType}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                new Date(booking.checkIn) <= new Date() &&
                                new Date(booking.checkOut) >= new Date()
                                  ? "bg-primary/10 text-primary"
                                  : "bg-orange-500/10 text-orange-500"
                              }`}
                            >
                              {new Date(booking.checkIn) <= new Date() &&
                              new Date(booking.checkOut) >= new Date()
                                ? "Active"
                                : "Upcoming"}
                            </span>
                            <span className="text-xs">
                              {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                              {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <p className="text-sm font-medium">
                            ${booking.room.price} / month
                          </p>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/bookings/${booking.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No bookings found</p>
                  <Button className="mt-4" asChild>
                    <Link href="/hostels">Find a Hostel</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                View your payment history and upcoming payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Upcoming Payments</h3>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments
                        .filter((payment) => payment.status === "PENDING")
                        .map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-lg border p-4"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div className="flex flex-col gap-1">
                                <h4 className="font-medium">
                                  {payment.description}
                                </h4>
                                {payment.booking?.room?.hostel && (
                                  <p className="text-sm text-muted-foreground">
                                    {payment.booking.room.hostel.name}, Room{" "}
                                    {payment.booking.room.roomNumber}
                                  </p>
                                )}
                                {payment.dueDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Due on:{" "}
                                    {new Date(
                                      payment.dueDate as string
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 md:items-end">
                                <p className="text-sm font-medium">
                                  ${payment.amount.toFixed(2)}
                                </p>
                                <Button
                                  size="sm"
                                  disabled={payingId === payment.id}
                                  onClick={() => handlePayNow(payment)}
                                >
                                  {payingId === payment.id ? (
                                    <span className="flex items-center gap-2">
                                      <BrandSpinner size="sm" />
                                      Redirecting...
                                    </span>
                                  ) : (
                                    "Pay Now"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      No upcoming payments
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Payment History</h3>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments
                        .filter((payment) => payment.status === "COMPLETED")
                        .map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {payment.description}
                              </p>
                              {payment.booking?.room?.hostel && (
                                <p className="text-sm text-muted-foreground">
                                  {payment.booking.room.hostel.name}, Room{" "}
                                  {payment.booking.room.roomNumber}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ${payment.amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  payment.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      No payment history
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
