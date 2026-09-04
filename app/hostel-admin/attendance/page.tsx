"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Camera, Check, Plane, ScanLine, Users, XCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { ATTENDANCE_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { attendanceApi, bookingApi } from "@/services/api";
import type { AttendanceStatus } from "@/services/api/attendance";
import { formatDate, initialsFromName } from "@/lib/format";
import { cn } from "@/lib/utils";

type StudentRow = { id: string; name: string | null; email: string | null };

const MARK_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: string;
}[] = [
  { value: "PRESENT", label: "Present", icon: Check, active: "bg-success text-white border-success" },
  { value: "ABSENT", label: "Absent", icon: XCircle, active: "bg-danger text-white border-danger" },
  { value: "LEAVE", label: "Leave", icon: Plane, active: "bg-info text-white border-info" },
];

export default function AttendancePage() {
  const { hostel } = useMyHostel();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("manual");
  const scannerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!hostel) return;
    setLoading(true);
    try {
      const [bookingsRes, attendanceRes] = await Promise.all([
        bookingApi.getAll({ limit: 200, hostelId: hostel.id }),
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
    const previous = attendance[studentId];
    // Optimistic: marking a roll of 200 must feel instant, so the row updates
    // first and only rolls back if the request fails.
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    try {
      await attendanceApi.mark({
        studentId,
        hostelId: hostel.id,
        date: new Date().toISOString(),
        status,
      });
    } catch (error) {
      setAttendance((prev) => {
        const next = { ...prev };
        if (previous) next[studentId] = previous;
        else delete next[studentId];
        return next;
      });
      toast.error(error instanceof Error ? error.message : "Failed to mark attendance");
    }
  };

  /**
   * The camera is started only while the Scan tab is open.
   *
   * Previously this ran on mount, so simply opening Attendance to mark a roll
   * by hand triggered a camera-permission prompt and left the camera running.
   */
  useEffect(() => {
    if (!hostel || tab !== "scan") return;
    let scanner: any;
    let started = false;
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
              const data = await attendanceApi.scan({
                token: decodedText,
                hostelId: hostel.id,
              });
              setScanResult(`${data.student.name} marked present`);
              toast.success(`${data.student.name} marked present`);
              fetchData();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Scan failed");
            }
          },
          () => {}
        )
        .then(() => {
          started = true;
        })
        .catch(() => {
          // Camera denied or unavailable — manual marking still works.
          setScanResult("Camera unavailable. Mark attendance manually instead.");
        });
    });

    return () => {
      cancelled = true;
      // Stopping a scanner that never started throws; guard on `started`.
      if (started) scanner?.stop().catch(() => {});
    };
  }, [hostel, tab, fetchData]);

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    for (const s of students) {
      const status = attendance[s.id];
      if (status === "PRESENT") present++;
      else if (status === "ABSENT") absent++;
      else if (status === "LEAVE") leave++;
    }
    return { present, absent, leave, unmarked: students.length - present - absent - leave };
  }, [students, attendance]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter === "NOT_MARKED" && attendance[s.id]) return false;
      if (
        statusFilter !== "ALL" &&
        statusFilter !== "NOT_MARKED" &&
        attendance[s.id] !== statusFilter
      )
        return false;
      if (!query) return true;
      return [s.name, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
    });
  }, [students, attendance, statusFilter, search]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Attendance"
        description={`Roll call for ${formatDate(new Date())}`}
        breadcrumbs={[{ label: "Residents" }, { label: "Attendance" }]}
      />

      <MetricRow>
        <Metric
          label="Present"
          value={String(counts.present)}
          context={`of ${students.length} residents`}
          meter={{
            pct: students.length ? (counts.present / students.length) * 100 : 0,
            tone: "success",
          }}
        />
        <Metric label="Absent" value={String(counts.absent)} context="Not in the hostel" />
        <Metric label="On leave" value={String(counts.leave)} context="Approved absence" />
        <Metric
          label="Not marked"
          value={String(counts.unmarked)}
          context={counts.unmarked === 0 ? "Roll call complete" : "Still to record"}
          emphasis={counts.unmarked > 0 ? "alert" : "default"}
        />
      </MetricRow>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="manual">
            <Users className="size-4" />
            Mark manually
          </TabsTrigger>
          <TabsTrigger value="scan">
            <ScanLine className="size-4" />
            Scan entry pass
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Panel>
            <PanelHeader
              title="Today's roll"
              description={loading ? "Loading…" : `${filtered.length} shown`}
              icon={CalendarCheck}
            />

            <Toolbar>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Find a resident…"
                className="w-full sm:w-56"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-auto min-w-[9rem]" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Everyone</SelectItem>
                  <SelectItem value="NOT_MARKED">Not marked</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LEAVE">On leave</SelectItem>
                </SelectContent>
              </Select>
            </Toolbar>

            {loading ? (
              <SkeletonTable rows={8} columns={3} />
            ) : filtered.length === 0 ? (
              students.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No residents to mark"
                  description="Residents with an active booking appear here for daily roll call."
                />
              ) : statusFilter === "NOT_MARKED" ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="Roll call complete"
                  description="Everyone has been marked for today."
                />
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nobody matches this filter"
                  description="Try a different status or search term."
                />
              )
            ) : (
              <TableScroller maxHeight="calc(100vh - 30rem)">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Resident</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Mark as</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((student) => {
                      const current = attendance[student.id];
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-7">
                                <AvatarFallback>{initialsFromName(student.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {student.name || "Unnamed"}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {current ? (
                              <StatusBadge
                                registry={ATTENDANCE_STATUS}
                                value={current}
                                size="sm"
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">Not marked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* A 3-way control that also shows the current
                                answer, rather than three identical buttons
                                that give no feedback about state. */}
                            <div
                              role="group"
                              aria-label={`Attendance for ${student.name || student.email}`}
                              className="inline-flex overflow-hidden rounded-sm border border-border"
                            >
                              {MARK_OPTIONS.map((opt) => {
                                const isActive = current === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => markAttendance(student.id, opt.value)}
                                    className={cn(
                                      "inline-flex items-center gap-1 border-r border-border px-2 py-1 text-xs transition-ui last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                                      isActive
                                        ? opt.active
                                        : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    <opt.icon className="size-3" />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableScroller>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="scan">
          <Panel>
            <PanelHeader
              title="Scan a resident's entry pass"
              description="Point the camera at the QR code in their app"
              icon={Camera}
            />
            <div className="flex flex-col items-center gap-3 p-4">
              <div
                id="qr-scanner-region"
                ref={scannerRef}
                className="w-full max-w-sm overflow-hidden rounded-md border border-border bg-surface-sunken"
              />
              {scanResult && (
                <p className="text-center text-sm text-muted-foreground">{scanResult}</p>
              )}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
