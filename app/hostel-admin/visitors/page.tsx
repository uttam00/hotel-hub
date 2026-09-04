"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LogOut, UserCheck, UserPlus } from "lucide-react";

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
  TableHead,
  TableHeader,
  TableRow,
  TableScroller,
} from "@/components/ui/table";
import { SearchInput, Toolbar } from "@/components/ui/toolbar";
import { StatusBadge, VISITOR_STATUS } from "@/components/ui/status-badge";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { studentApi, visitorApi } from "@/services/api";
import { formatDateTime, formatPhone, formatTime } from "@/lib/format";

const EMPTY_FORM = { name: "", phone: "", purpose: "", visitingStudentId: "" };

/**
 * The visitor log — a front-desk tool, so the priority is logging someone in
 * fast and seeing at a glance who is still inside.
 */
export default function VisitorsPage() {
  const { hostel, loading: hostelLoading } = useMyHostel();
  const {
    data: visitors,
    loading,
    refetch: fetchVisitors,
  } = useFetch(hostel ? () => visitorApi.getAll(hostel.id) : null, [hostel]);

  // Residents power the "visiting" picker below.
  const { data: residents } = useFetch(
    hostel ? () => studentApi.getAll(hostel.id) : null,
    [hostel]
  );

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const onPremises = useMemo(
    () => (visitors ?? []).filter((v) => !v.checkOutAt).length,
    [visitors]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (visitors ?? []).filter((v) => {
      if (statusFilter === "ON_PREMISES" && v.checkOutAt) return false;
      if (statusFilter === "CHECKED_OUT" && !v.checkOutAt) return false;
      if (!query) return true;
      return [v.name, v.phone, v.purpose, v.visitingStudent.name, v.visitingStudent.email]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(query));
    });
  }, [visitors, statusFilter, search]);

  // One entry per resident — a student with several bookings must not appear
  // several times in the picker.
  const residentOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string }>();
    for (const b of residents ?? []) {
      if (b.user?.id && !seen.has(b.user.id)) {
        seen.set(b.user.id, {
          id: b.user.id,
          label: `${b.user.name || b.user.email} · Room ${b.room.roomNumber}`,
        });
      }
    }
    return Array.from(seen.values());
  }, [residents]);

  const canSubmit =
    form.name.trim() && form.phone.trim() && form.purpose.trim() && form.visitingStudentId;

  const handleSubmit = async () => {
    if (!hostel || !canSubmit) return;
    setSubmitting(true);
    try {
      await visitorApi.log({ ...form, hostelId: hostel.id });
      toast.success(`${form.name} signed in`);
      setOpen(false);
      setForm(EMPTY_FORM);
      fetchVisitors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log visitor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string, name: string) => {
    try {
      await visitorApi.checkOut(id);
      toast.success(`${name} signed out`);
      fetchVisitors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check out visitor");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Visitors"
        description="Who is on the premises, and who has been"
        breadcrumbs={[{ label: "Residents" }, { label: "Visitors" }]}
        action={
          <Button onClick={() => setOpen(true)} disabled={hostelLoading || !hostel}>
            <UserPlus className="size-3.5" />
            Sign in a visitor
          </Button>
        }
      />

      <MetricRow className="xl:grid-cols-2">
        <Metric
          label="Currently inside"
          value={String(onPremises)}
          context={onPremises === 0 ? "Nobody signed in" : "Yet to sign out"}
        />
        <Metric
          label="Total logged"
          value={String(visitors?.length ?? 0)}
          context="All visits on record"
        />
      </MetricRow>

      <Panel>
        <PanelHeader
          title="Visitor log"
          description={loading ? "Loading…" : `${filtered.length} shown`}
          icon={UserCheck}
        />

        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Visitor, phone or resident…"
            className="w-full sm:w-60"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[9rem]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All visitors</SelectItem>
              <SelectItem value="ON_PREMISES">On premises</SelectItem>
              <SelectItem value="CHECKED_OUT">Checked out</SelectItem>
            </SelectContent>
          </Select>
        </Toolbar>

        {loading ? (
          <SkeletonTable rows={6} columns={6} />
        ) : filtered.length === 0 ? (
          visitors && visitors.length > 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No visitors match this filter"
              description="Try a different status or search term."
            />
          ) : (
            <EmptyState
              icon={UserCheck}
              title="No visitors logged yet"
              description="Sign someone in at the gate and they'll be tracked here until they leave."
              actionLabel="Sign in a visitor"
              onAction={() => setOpen(true)}
            />
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 26rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Visitor</TableHead>
                  <TableHead>Visiting</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Signed in</TableHead>
                  <TableHead>Signed out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(v.phone)}</p>
                    </TableCell>
                    <TableCell>{v.visitingStudent.name || v.visitingStudent.email}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-muted-foreground">
                      {v.purpose}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(v.checkInAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {v.checkOutAt ? formatTime(v.checkOutAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        registry={VISITOR_STATUS}
                        value={v.checkOutAt ? "CHECKED_OUT" : "ON_PREMISES"}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {!v.checkOutAt && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleCheckOut(v.id, v.name)}
                        >
                          <LogOut className="size-3" />
                          Sign out
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>

      {/* ---------- Sign-in drawer ---------- */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Sign in a visitor</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-5">
            <section className="space-y-3">
              <h3 className="label-annotation">Visitor</h3>
              <div className="space-y-1.5">
                <Label htmlFor="v-name">Full name</Label>
                <Input
                  id="v-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Anjali Deshmukh"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-phone">Phone</Label>
                <Input
                  id="v-phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="label-annotation">Visit</h3>
              <div className="space-y-1.5">
                <Label htmlFor="v-resident">Resident being visited</Label>
                {/*
                  Previously this asked the person at the gate to paste a raw
                  student ID copied from a booking — unusable in practice. It is
                  now a searchable list of residents with their room numbers.
                */}
                <Select
                  value={form.visitingStudentId}
                  onValueChange={(value) => setForm((f) => ({ ...f, visitingStudentId: value }))}
                >
                  <SelectTrigger id="v-resident">
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residentOptions.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        No residents to visit yet
                      </div>
                    ) : (
                      residentOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="v-purpose">Purpose</Label>
                <Input
                  id="v-purpose"
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="Family visit"
                />
              </div>
            </section>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
