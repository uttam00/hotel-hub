"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/layout/page-header";
import { Plus } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";

const CATEGORIES = ["UTILITIES", "SALARY", "MAINTENANCE", "SUPPLIES", "OTHER"];

type Expense = { id: string; category: string; amount: number; description: string | null; date: string };
type ExpensesResponse = { expenses: Expense[]; summary: { category: string; total: number }[] };

export default function ExpensesPage() {
  const { hostel } = useMyHostel();
  const { data, loading, refetch: fetchExpenses } = useFetch<ExpensesResponse>(
    hostel ? `/api/hostel-admin/expenses?hostelId=${hostel.id}` : null
  );
  const expenses = data?.expenses ?? [];
  const summary = data?.summary ?? [];
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
      const res = await fetch("/api/hostel-admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hostelId: hostel.id, amount: Number(form.amount) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Expense recorded");
      setOpen(false);
      setForm({ category: "OTHER", amount: "", description: "", date: new Date().toISOString().slice(0, 10) });
      fetchExpenses();
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const total = summary.reduce((sum, s) => sum + s.total, 0);

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
        <CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
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
                items={expenses}
                colSpan={4}
                emptyTitle="No expenses recorded"
                emptyDescription="Expenses you add will show up here."
              >
                {(expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.category}</TableCell>
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
