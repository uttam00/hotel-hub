"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { PageHeader } from "@/components/layout/page-header";
import { UserPlus } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";

type Visitor = {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  checkInAt: string;
  checkOutAt: string | null;
  visitingStudent: { name: string | null; email: string | null };
};

export default function VisitorsPage() {
  const { hostel, loading: hostelLoading } = useMyHostel();
  const { data: visitors, loading, refetch: fetchVisitors } = useFetch<Visitor[]>(
    hostel ? `/api/hostel-admin/visitors?hostelId=${hostel.id}` : null
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", purpose: "", visitingStudentId: "" });

  const handleSubmit = async () => {
    if (!hostel) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/hostel-admin/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hostelId: hostel.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log visitor");
      }
      toast.success("Visitor logged");
      setOpen(false);
      setForm({ name: "", phone: "", purpose: "", visitingStudentId: "" });
      fetchVisitors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log visitor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const res = await fetch(`/api/hostel-admin/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkOut: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch {
      toast.error("Failed to check out visitor");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        description="Log and track visitors to your hostel"
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={hostelLoading || !hostel}>
              <UserPlus className="mr-2 h-4 w-4" /> Log Visitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a Visitor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Visitor Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Purpose of Visit</Label>
                <Input value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} />
              </div>
              <div>
                <Label>Student Being Visited (Student ID)</Label>
                <Input
                  value={form.visitingStudentId}
                  onChange={(e) => setForm((f) => ({ ...f, visitingStudentId: e.target.value }))}
                  placeholder="Copy the student's ID from their booking"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Logging..." : "Log Visitor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Visitor Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Visiting</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Checked In</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows
                loading={loading}
                items={visitors ?? []}
                colSpan={6}
                emptyTitle="No visitors yet"
                emptyDescription="Visitors you log will show up here."
              >
                {(v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.name} · {v.phone}</TableCell>
                    <TableCell>{v.visitingStudent.name || v.visitingStudent.email}</TableCell>
                    <TableCell>{v.purpose}</TableCell>
                    <TableCell>{new Date(v.checkInAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={v.checkOutAt ? "secondary" : "default"}>
                        {v.checkOutAt ? "Checked out" : "On premises"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!v.checkOutAt && (
                        <Button size="sm" variant="outline" onClick={() => handleCheckOut(v.id)}>
                          Check Out
                        </Button>
                      )}
                    </TableCell>
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
