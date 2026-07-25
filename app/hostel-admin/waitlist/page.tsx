"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { StatusFilterSelect } from "@/components/common-in-admin/StatusFilterSelect";
import { PageHeader } from "@/components/layout/page-header";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getWaitlistStatusColor } from "@/lib/status-colors";
import { waitlistApi } from "@/services/api";

const STATUS_OPTIONS = [
  { value: "WAITING", label: "Waiting" },
  { value: "NOTIFIED", label: "Notified" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function WaitlistPage() {
  const { hostel } = useMyHostel();
  const { data: entries, loading } = useFetch(
    hostel ? () => waitlistApi.getAll(hostel.id) : null,
    [hostel]
  );
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredEntries = useMemo(() => {
    if (statusFilter === "ALL") return entries ?? [];
    return (entries ?? []).filter((e) => e.status === statusFilter);
  }, [entries, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Waiting List" description="Students waiting for a room to open up" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Waiting Students</CardTitle>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows
                loading={loading}
                items={filteredEntries}
                colSpan={4}
                emptyTitle="No one is waiting"
                emptyDescription="Students who join the waitlist for a full room type will show up here."
              >
                {(entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.student.name || entry.student.email}</TableCell>
                    <TableCell>{entry.roomType}</TableCell>
                    <TableCell>{new Date(entry.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={getWaitlistStatusColor(entry.status)}>{entry.status}</Badge></TableCell>
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
