"use client";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getBookingStatusColor } from "@/lib/status-colors";

type StudentBooking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  user: { id: string; name: string | null; email: string | null; phoneNumber: string | null };
  room: { id: string; roomNumber: string; roomType: string };
};

export default function StudentsPage() {
  const { hostel } = useMyHostel();
  const { data: students, loading } = useFetch<StudentBooking[]>(
    hostel ? `/api/hostel-admin/students?hostelId=${hostel.id}` : null
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Students with a booking at your hostel" />

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
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
                items={students ?? []}
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
