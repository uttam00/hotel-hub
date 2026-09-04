"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Receipt } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import {
  PAYMENT_STATUS,
  StatusBadge,
  derivePaymentStatus,
} from "@/components/ui/status-badge";
import { paymentApi } from "@/services/api";
import { formatCurrency, formatDate, humanizeEnum } from "@/lib/format";
import type { Payment } from "@/types";

function StudentPaymentsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentApi.getAll();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchPayments();
  }, [session, fetchPayments]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Payment received — thank you!");
      fetchPayments();
    } else if (checkout === "cancelled") {
      toast.error("Checkout was cancelled — no charge was made.");
    }
  }, [searchParams, fetchPayments]);

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

  const rows = useMemo(
    () => payments.map((p) => ({ payment: p, status: derivePaymentStatus(p) })),
    [payments]
  );

  const totalPaid = rows
    .filter(({ status }) => status === "COMPLETED")
    .reduce((sum, { payment }) => sum + payment.amount, 0);
  const outstanding = rows.filter(
    ({ status }) => status === "PENDING" || status === "OVERDUE"
  );
  const outstandingTotal = outstanding.reduce((s, { payment }) => s + payment.amount, 0);
  const overdueCount = rows.filter(({ status }) => status === "OVERDUE").length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="My payments"
        description="What you've paid and what's still due"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Payments" }]}
      />

      <MetricRow className="xl:grid-cols-3">
        <Metric label="Paid to date" value={formatCurrency(totalPaid)} context="All settled payments" />
        <Metric
          label="Outstanding"
          value={formatCurrency(outstandingTotal)}
          context={
            outstanding.length === 0
              ? "You're all paid up"
              : `${outstanding.length} payment${outstanding.length === 1 ? "" : "s"}${
                  overdueCount > 0 ? ` · ${overdueCount} overdue` : ""
                }`
          }
          emphasis={overdueCount > 0 ? "alert" : "default"}
        />
        <Metric label="Transactions" value={String(payments.length)} context="On record" />
      </MetricRow>

      <Panel>
        <PanelHeader
          title="Transaction history"
          description={loading ? "Loading…" : `${payments.length} payments`}
          icon={Receipt}
        />

        {status === "loading" || loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No transactions yet"
            description="Your payment history will appear here once you book a room."
            actionLabel="Browse hostels"
            actionHref="/hostels"
          />
        ) : (
          <TableScroller>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Payment</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ payment, status: payStatus }) => {
                  const room = payment.booking?.room;
                  const hostelName = room?.hostel?.name;
                  const reference = payment.id.slice(-8).toUpperCase();
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">
                          {hostelName || payment.description || "Hostel fee"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {room ? `Room ${room.roomNumber} · ` : ""}
                          <span className="identifier">#{reference}</span>
                        </p>
                        {payStatus === "REFUNDED" && payment.refundedAmount != null && (
                          <p className="text-xs text-muted-foreground">
                            Refunded {formatCurrency(payment.refundedAmount)}
                            {payment.refundReason ? ` — ${payment.refundReason}` : ""}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {payment.method ? humanizeEnum(payment.method) : "Card"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={payStatus === "OVERDUE" ? "text-danger" : undefined}>
                          {payment.dueDate ? formatDate(payment.dueDate) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge registry={PAYMENT_STATUS} value={payStatus} size="sm" />
                      </TableCell>
                      <TableCell numeric className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "PENDING" && (
                          <Button
                            size="xs"
                            disabled={payingId !== null}
                            onClick={() => handlePayNow(payment)}
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
    </div>
  );
}

export default function StudentPaymentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading your payments…" />}>
      <StudentPaymentsContent />
    </Suspense>
  );
}
