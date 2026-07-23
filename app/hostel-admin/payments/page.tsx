"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { paymentApi } from "@/services/api";
import { getPaymentStatusColor } from "@/lib/status-colors";
import { Payment } from "@/types";

export default function HostelAdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentApi
      .getAll({ limit: 100 })
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage message="Loading payments..." />;
  }

  const totalCollected = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Payment history for your hostel" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Collected</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              ₹{totalCollected.toFixed(2)}
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
          <CardContent className="py-4">
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Payments made by your students will show up here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {payment.booking?.user?.name || payment.booking?.user?.email || "Unknown student"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.booking?.room
                          ? `${payment.booking.room.roomType} — #${payment.booking.room.roomNumber} • `
                          : ""}
                        {payment.method || "Card Payment"} •{" "}
                        {new Date(payment.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {payment.status === "REFUNDED" && payment.refundedAmount != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Refunded ₹{payment.refundedAmount.toFixed(2)}
                          {payment.refundReason ? ` — ${payment.refundReason}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={getPaymentStatusColor(payment.status)}>{payment.status}</Badge>
                    <span className="font-semibold text-lg">₹{payment.amount.toFixed(2)}</span>
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
