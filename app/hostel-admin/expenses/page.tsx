"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { StatusFilterSelect } from "@/components/common-in-admin/StatusFilterSelect";
import { PageHeader } from "@/components/layout/page-header";
import { Plus } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getExpenseCategoryColor } from "@/lib/status-colors";
import { expenseApi } from "@/services/api";

const CATEGORIES = ["UTILITIES", "SALARY", "MAINTENANCE", "SUPPLIES", "OTHER"];
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }));

export default function ExpensesPage() {
  const { hostel } = useMyHostel();
  const { data, loading, refetch: fetchExpenses } = useFetch(
    hostel ? () => expenseApi.getAll(hostel.id) : null,
    [hostel]
  );
  const expenses = data?.expenses ?? [];
  const summary = data?.summary ?? [];
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: "OTHER",
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = async () => {
    if (!hostel || !form.amount) return;
    setSubmitting(true);
    try {
      await expenseApi.create({ ...form, hostelId: hostel.id, amount: Number(form.amount) });
      toast.success("Expense recorded");
      setOpen(false);
      setForm({ category: "OTHER", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
      fetchExpenses();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const total = summary.reduce((sum, s) => sum + s.total, 0);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "ALL") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track hostel operating costs"
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record an Expense</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total This Period</CardDescription>
            <CardTitle className="text-2xl">₹{total.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        {summary.slice(0, 2).map((s) => (
          <Card key={s.category}>
            <CardHeader className="pb-2">
              <CardDescription>{s.category}</CardDescription>
              <CardTitle className="text-2xl">₹{s.total.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>All Expenses</CardTitle>
          <StatusFilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS}
            label="Categories"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows
                loading={loading}
                items={filteredExpenses}
                colSpan={4}
                emptyTitle="No expenses recorded"
                emptyDescription="Expenses you add will show up here."
              >
                {(expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getExpenseCategoryColor(expense.category)}>{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{expense.description || "—"}</TableCell>
                    <TableCell className="text-right">₹{expense.amount.toFixed(2)}</TableCell>
                  </TableRow>
                )}
              </TableRows>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
