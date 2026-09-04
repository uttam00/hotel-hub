"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Metric, MetricRow } from "@/components/ui/metric";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { SearchInput, Toolbar } from "@/components/ui/toolbar";
import { EXPENSE_CATEGORY, StatusBadge, resolveStatus } from "@/components/ui/status-badge";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { expenseApi } from "@/services/api";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/format";

const CATEGORIES = ["UTILITIES", "SALARY", "MAINTENANCE", "SUPPLIES", "OTHER"];

const emptyForm = () => ({
  category: "OTHER",
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
});

export default function ExpensesPage() {
  const { hostel } = useMyHostel();
  const {
    data,
    loading,
    refetch: fetchExpenses,
  } = useFetch(hostel ? () => expenseApi.getAll(hostel.id) : null, [hostel]);

  const expenses = data?.expenses ?? [];
  const summary = data?.summary ?? [];

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const total = summary.reduce((sum, s) => sum + s.total, 0);
  // The largest category is the one worth naming on the dashboard strip.
  const topCategory = useMemo(
    () => [...summary].sort((a, b) => b.total - a.total)[0],
    [summary]
  );

  const canSubmit = Number(form.amount) > 0 && form.date;

  const handleSubmit = async () => {
    if (!hostel || !canSubmit) return;
    setSubmitting(true);
    try {
      await expenseApi.create({ ...form, hostelId: hostel.id, amount: Number(form.amount) });
      toast.success(`Expense of ${formatCurrency(Number(form.amount))} recorded`);
      setOpen(false);
      setForm(emptyForm());
      fetchExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      if (!query) return true;
      return [e.description, e.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [expenses, categoryFilter, search]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Expenses"
        description="What it costs to run the hostel"
        breadcrumbs={[{ label: "Finance" }, { label: "Expenses" }]}
        action={
          <Button onClick={() => setOpen(true)} disabled={!hostel}>
            <Plus className="size-3.5" />
            Record expense
          </Button>
        }
      />

      <MetricRow className="xl:grid-cols-3">
        <Metric label="Total spend" value={formatCurrencyCompact(total)} context="This period" />
        <Metric
          label="Largest category"
          value={topCategory ? formatCurrencyCompact(topCategory.total) : "—"}
          context={
            topCategory ? resolveStatus(EXPENSE_CATEGORY, topCategory.category).label : "No spend yet"
          }
        />
        <Metric
          label="Entries"
          value={String(expenses.length)}
          context="Recorded transactions"
        />
      </MetricRow>

      {/* Category breakdown as proportional bars — five categories in a pie
          would be less readable than five labelled rows. */}
      {summary.length > 0 && (
        <Panel>
          <PanelHeader title="By category" description="Share of total spend" />
          <ul className="divide-y divide-border">
            {[...summary]
              .sort((a, b) => b.total - a.total)
              .map((s) => {
                const pct = total > 0 ? (s.total / total) * 100 : 0;
                return (
                  <li key={s.category} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge registry={EXPENSE_CATEGORY} value={s.category} size="sm" />
                      <span className="font-mono text-sm">
                        {formatCurrency(s.total)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
          </ul>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          title="All expenses"
          description={loading ? "Loading…" : `${filtered.length} shown`}
          icon={Receipt}
        />

        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Description or category…"
            className="w-full sm:w-56"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[9rem]" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {resolveStatus(EXPENSE_CATEGORY, c).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Toolbar>

        {loading ? (
          <SkeletonTable rows={6} columns={4} />
        ) : filtered.length === 0 ? (
          expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses recorded"
              description="Track utilities, salaries, repairs and supplies here to see what the hostel actually costs to run."
              actionLabel="Record the first expense"
              onAction={() => setOpen(true)}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No expenses match this filter"
              description="Try a different category or search term."
            />
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 30rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead numeric>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <StatusBadge registry={EXPENSE_CATEGORY} value={expense.category} size="sm" />
                    </TableCell>
                    <TableCell className="max-w-[20rem] truncate text-muted-foreground">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell numeric>{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
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

      {/* ---------- Record drawer ---------- */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Record an expense</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="e-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger id="e-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {resolveStatus(EXPENSE_CATEGORY, c).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="e-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="pl-6 font-mono"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e-date">Date</Label>
              <Input
                id="e-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="e-desc">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="e-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Electricity bill for August"
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? "Recording…" : "Record expense"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
