"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { paymentApi } from "@/services/api";
import { Payment } from "@/types";
import { getPaymentStatusColor, OVERDUE_COLOR, PAYMENT_STATUS_CHART_COLORS } from "@/lib/status-colors";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

function isOverdue(payment: Payment) {
  return payment.status === "PENDING" && !!payment.dueDate && new Date(payment.dueDate) < new Date();
}

function StudentPaymentsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentApi.getAll();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Payment received — thank you!");
      fetchPayments();
    } else if (checkout === "cancelled") {
      toast.error("Checkout was cancelled — no charge was made.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  if (status === "loading" || loading) {
    return <LoadingSpinner fullPage message="Loading your payments..." />;
  }

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const overdueCount = payments.filter(isOverdue).length;

  const breakdown = ["COMPLETED", "PENDING", "FAILED", "REFUNDED"]
    .map((status) => ({
      status,
      value: payments.filter((p) => p.status === status).reduce((sum, p) => sum + p.amount, 0),
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
          <p className="text-muted-foreground">
            View your transaction history
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="grid gap-4 sm:grid-cols-3 md:col-span-2 md:grid-cols-1 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                ₹{totalPaid.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-2xl">{payments.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                {pendingCount}
                {overdueCount > 0 && (
                  <span className="ml-2 text-sm font-medium text-amber-600">
                    ({overdueCount} overdue)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {breakdown.length > 0 && (
          <Card className="md:row-span-1">
            <CardHeader className="pb-0">
              <CardDescription>Breakdown by Status</CardDescription>
            </CardHeader>
            <CardContent className="h-40 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="value"
                    nameKey="status"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {breakdown.map((d) => (
                      <Cell key={d.status} fill={PAYMENT_STATUS_CHART_COLORS[d.status] ?? "#9ca3af"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No transactions yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Your payment history will appear here after you make a booking.
            </p>
            <Link href="/hostels">
              <Button>Browse Hostels</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {payments.map((payment) => {
            const room = payment.booking?.room;
            const hostelName = room?.hostel?.name;
            const roomLabel = room ? `${room.roomType} — #${room.roomNumber}` : null;
            const overdue = isOverdue(payment);

            return (
            <Card
              key={payment.id}
              className={`hover:shadow-md transition-shadow ${overdue ? "border-amber-300 dark:border-amber-800" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {hostelName ? `${hostelName}${roomLabel ? ` — ${roomLabel}` : ""}` : `Payment #${payment.id.slice(-8).toUpperCase()}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {hostelName ? `Payment #${payment.id.slice(-8).toUpperCase()} • ` : ""}
                        {payment.method || "Card Payment"} •{" "}
                        {new Date(payment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                      {payment.status === "REFUNDED" && payment.refundedAmount != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Refunded ₹{payment.refundedAmount.toFixed(2)}
                          {payment.refundReason ? ` — ${payment.refundReason}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={overdue ? OVERDUE_COLOR : getPaymentStatusColor(payment.status)}>
                        {overdue ? "Overdue" : payment.status}
                      </Badge>
                      <span className="font-semibold text-lg">
                        ₹{payment.amount.toFixed(2)}
                      </span>
                    </div>
                    {payment.status === "PENDING" && (
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentPaymentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading your payments..." />}>
      <StudentPaymentsContent />
    </Suspense>
  );
}
