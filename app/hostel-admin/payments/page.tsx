"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { ActiveFilters, SearchInput, Toolbar } from "@/components/ui/toolbar";
import {
  PAYMENT_STATUS,
  StatusBadge,
  derivePaymentStatus,
} from "@/components/ui/status-badge";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { paymentApi } from "@/services/api";
import { formatCurrency, formatDate, daysUntil, humanizeEnum } from "@/lib/format";
import type { Payment } from "@/types";

const STATUS_OPTIONS = [
  { value: "COMPLETED", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

/**
 * Collections (§15).
 *
 * The list is filtered on the *derived* status, not the stored one, so
 * "Overdue" is a first-class filter even though PaymentStatus has no such
 * value — that is the state an accountant actually works from. The dashboard's
 * dues metric links straight here with ?status=OVERDUE.
 */
export default function HostelAdminPaymentsPage() {
  const { hostel, loading: hostelLoading } = useMyHostel();
  const searchParams = useSearchParams();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!hostel) return;
    setLoading(true);
    paymentApi
      .getAll({ limit: 200, hostelId: hostel.id })
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [hostel]);

  // Derive once, then filter — so every row's badge and the filter agree.
  const withStatus = useMemo(
    () => payments.map((p) => ({ payment: p, status: derivePaymentStatus(p) })),
    [payments]
  );

  const totals = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    let overdue = 0;
    let overdueCount = 0;
    for (const { payment, status } of withStatus) {
      if (status === "COMPLETED") collected += payment.amount;
      if (status === "PENDING" || status === "OVERDUE") outstanding += payment.amount;
      if (status === "OVERDUE") {
        overdue += payment.amount;
        overdueCount += 1;
      }
    }
    return { collected, outstanding, overdue, overdueCount };
  }, [withStatus]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return withStatus.filter(({ payment, status }) => {
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (!query) return true;
      return [
        payment.booking?.user?.name,
        payment.booking?.user?.email,
        payment.booking?.room?.roomNumber,
        payment.description,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [withStatus, statusFilter, search]);

  const filteredTotal = filtered.reduce((s, { payment }) => s + payment.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Payments"
        description="Collections, dues and refunds for your hostel"
        breadcrumbs={[{ label: "Finance" }, { label: "Payments" }]}
      />

      <MetricRow>
        <Metric
          label="Collected"
          value={formatCurrency(totals.collected)}
          context="All completed payments"
        />
        <Metric
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          context="Awaiting payment"
        />
        <Metric
          label="Overdue"
          value={formatCurrency(totals.overdue)}
          context={
            totals.overdueCount === 0
              ? "Nothing past due"
              : `${totals.overdueCount} payment${totals.overdueCount === 1 ? "" : "s"}`
          }
          emphasis={totals.overdueCount > 0 ? "alert" : "default"}
        />
        <Metric
          label="Transactions"
          value={String(payments.length)}
          context="On record"
        />
      </MetricRow>

      <Panel>
        <PanelHeader
          title="Transactions"
          description={loading ? "Loading…" : `${filtered.length} shown`}
          icon={Wallet}
        />

        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Resident, room or description…"
            className="w-full sm:w-64"
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
          <ActiveFilters
            count={statusFilter !== "ALL" ? 1 : 0}
            onClear={() => setStatusFilter("ALL")}
          />
        </Toolbar>

        {hostelLoading || loading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : filtered.length === 0 ? (
          payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Fees collected from your residents will appear here, with what's paid and what's still owed."
            />
          ) : statusFilter === "OVERDUE" ? (
            <EmptyState
              icon={CreditCard}
              title="Nothing is overdue"
              description="Every resident is up to date on their payments."
            >
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("ALL")}>
                Show all payments
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payments match this filter"
              description="Try a different status, or clear the filter to see everything."
            >
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("ALL")}>
                Clear filter
              </Button>
            </EmptyState>
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 26rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ payment, status }) => {
                  const due = daysUntil(payment.dueDate);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <p className="truncate font-medium text-foreground">
                          {payment.booking?.user?.name ||
                            payment.booking?.user?.email ||
                            "Unknown resident"}
                        </p>
                      </TableCell>
                      <TableCell className="identifier">
                        {payment.booking?.room?.roomNumber ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                        {payment.description || "Hostel fee"}
                        {status === "REFUNDED" && payment.refundedAmount != null && (
                          <span className="block text-xs">
                            Refunded {formatCurrency(payment.refundedAmount)}
                            {payment.refundReason ? ` — ${payment.refundReason}` : ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {payment.method ? humanizeEnum(payment.method) : "Card"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {payment.dueDate ? (
                          <span className={status === "OVERDUE" ? "text-danger" : undefined}>
                            {formatDate(payment.dueDate)}
                            {due != null && status === "OVERDUE" && (
                              <span className="block text-xs">
                                {Math.abs(due)} day{Math.abs(due) === 1 ? "" : "s"} late
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge registry={PAYMENT_STATUS} value={status} size="sm" />
                      </TableCell>
                      <TableCell numeric className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Total shown
                  </TableCell>
                  <TableCell numeric className="font-semibold">
                    {formatCurrency(filteredTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableScroller>
        )}
      </Panel>
    </div>
  );
}
