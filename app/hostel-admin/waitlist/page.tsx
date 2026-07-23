"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { PageHeader } from "@/components/layout/page-header";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";

type WaitlistEntry = {
  id: string;
  roomType: string;
  status: string;
  requestedAt: string;
  student: { name: string | null; email: string | null };
};

export default function WaitlistPage() {
  const { hostel } = useMyHostel();
  const { data: entries, loading } = useFetch<WaitlistEntry[]>(
    hostel ? `/api/hostels/${hostel.id}/waitlist` : null
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Waiting List" description="Students waiting for a room to open up" />

      <Card>
        <CardHeader><CardTitle>Waiting Students</CardTitle></CardHeader>
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
                items={entries ?? []}
                colSpan={4}
                emptyTitle="No one is waiting"
                emptyDescription="Students who join the waitlist for a full room type will show up here."
              >
                {(entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.student.name || entry.student.email}</TableCell>
                    <TableCell>{entry.roomType}</TableCell>
                    <TableCell>{new Date(entry.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={entry.status === "NOTIFIED" ? "default" : "secondary"}>{entry.status}</Badge></TableCell>
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
