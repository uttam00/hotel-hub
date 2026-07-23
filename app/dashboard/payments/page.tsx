"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
import { getPaymentStatusColor } from "@/lib/status-colors";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
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
              {payments.filter((p) => p.status === "PENDING").length}
            </CardTitle>
          </CardHeader>
        </Card>
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
          {payments.map((payment) => (
            <Card
              key={payment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Payment #{payment.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
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
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
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
          ))}
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
