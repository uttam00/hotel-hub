"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { StatusFilterSelect } from "@/components/common-in-admin/StatusFilterSelect";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getBookingStatusColor } from "@/lib/status-colors";
import { studentApi } from "@/services/api";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

export default function StudentsPage() {
  const { hostel } = useMyHostel();
  const { data: students, loading } = useFetch(
    hostel ? () => studentApi.getAll(hostel.id) : null,
    [hostel]
  );
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredStudents = useMemo(() => {
    if (statusFilter === "ALL") return students ?? [];
    return (students ?? []).filter((b) => b.status === statusFilter);
  }, [students, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Students with a booking at your hostel" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>All Students</CardTitle>
          <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRows
                loading={loading}
                items={filteredStudents}
                colSpan={5}
                emptyIcon={Users}
                emptyTitle="No students yet"
                emptyDescription="Students with a booking at your hostel will show up here."
              >
                {(b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>{b.user.name || "—"}</div>
                      <div className="text-sm text-muted-foreground">{b.user.email}</div>
                    </TableCell>
                    <TableCell>{b.room.roomType} — #{b.room.roomNumber}</TableCell>
                    <TableCell>
                      <Badge className={getBookingStatusColor(b.status)}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(b.checkIn).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(b.checkOut).toLocaleDateString()}</TableCell>
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
