"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TableRows } from "@/components/ui/table-state";
import { StatusFilterSelect } from "@/components/common-in-admin/StatusFilterSelect";
import { PageHeader } from "@/components/layout/page-header";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { getAttendanceStatusColor } from "@/lib/status-colors";
import { attendanceApi, bookingApi } from "@/services/api";
import type { AttendanceStatus } from "@/services/api/attendance";

type StudentRow = { id: string; name: string | null; email: string | null };

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LEAVE", label: "Leave" },
  { value: "NOT_MARKED", label: "Not marked" },
];

export default function AttendancePage() {
  const { hostel } = useMyHostel();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const scannerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!hostel) return;
    setLoading(true);
    try {
      const [bookingsRes, attendanceRes] = await Promise.all([
        bookingApi.getAll({ limit: 100, hostelId: hostel.id }),
        attendanceApi.getAll(hostel.id),
      ]);

      const uniqueStudents = new Map<string, StudentRow>();
      for (const booking of bookingsRes.data || []) {
        if (booking.status === "CONFIRMED" || booking.status === "PENDING") {
          uniqueStudents.set(booking.user.id, booking.user);
        }
      }
      setStudents(Array.from(uniqueStudents.values()));

      const map: Record<string, AttendanceStatus> = {};
      for (const record of attendanceRes) map[record.studentId] = record.status;
      setAttendance(map);
    } finally {
      setLoading(false);
    }
  }, [hostel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAttendance = async (studentId: string, status: AttendanceStatus) => {
    if (!hostel) return;
    try {
      await attendanceApi.mark({ studentId, hostelId: hostel.id, date: new Date().toISOString(), status });
      setAttendance((prev) => ({ ...prev, [studentId]: status }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark attendance");
    }
  };

  useEffect(() => {
    if (!hostel) return;
    let scanner: any;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled || !scannerRef.current) return;
      scanner = new Html5Qrcode(scannerRef.current.id);
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            try {
              const data = await attendanceApi.scan({ token: decodedText, hostelId: hostel.id });
              setScanResult(`Marked present: ${data.student.name}`);
              toast.success(`${data.student.name} marked present`);
              fetchData();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Scan failed");
            }
          },
          () => {}
        )
        .catch(() => {
          // Camera not available/denied — manual marking below still works.
        });
    });

    return () => {
      cancelled = true;
      scanner?.stop().catch(() => {});
    };
  }, [hostel, fetchData]);

  const filteredStudents = useMemo(() => {
    if (statusFilter === "ALL") return students;
    if (statusFilter === "NOT_MARKED") return students.filter((s) => !attendance[s.id]);
    return students.filter((s) => attendance[s.id] === statusFilter);
  }, [students, attendance, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark today's attendance manually or by scanning student QR codes"
      />

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Mark Manually</TabsTrigger>
          <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>Today&apos;s Students</CardTitle>
              <StatusFilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Mark As</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRows
                    loading={loading}
                    items={filteredStudents}
                    colSpan={3}
                    emptyTitle="No active students"
                    emptyDescription="Students with an active booking will show up here."
                  >
                    {(student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name || student.email}</TableCell>
                        <TableCell>
                          {attendance[student.id] ? (
                            <Badge className={getAttendanceStatusColor(attendance[student.id])}>
                              {attendance[student.id]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not marked</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => markAttendance(student.id, "PRESENT")}>
                            Present
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markAttendance(student.id, "ABSENT")}>
                            Absent
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => markAttendance(student.id, "LEAVE")}>
                            Leave
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableRows>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Scan a Student&apos;s QR Code</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div id="qr-scanner-region" ref={scannerRef} className="mx-auto max-w-sm" />
              {scanResult && <p className="text-center text-sm text-muted-foreground">{scanResult}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
