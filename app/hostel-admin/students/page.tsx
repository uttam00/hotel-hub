"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field, FieldList } from "@/components/ui/panel";
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
import { ActiveFilters, SearchInput, Toolbar } from "@/components/ui/toolbar";
import { BOOKING_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { studentApi } from "@/services/api";
import type { StudentBooking } from "@/services/api/student";
import { inferFloor, floorLabel } from "@/lib/occupancy";
import { formatDate, formatPhone, initialsFromName } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Checked out" },
];

/**
 * The resident register (§13).
 *
 * Filtering happens in memory over the hostel's residents — at hostel scale
 * (hundreds, not millions) that makes search feel instant, which is the whole
 * point of the requirement. Clicking a row opens a 360° drawer rather than
 * navigating away, so the warden keeps their place in the list.
 */
export default function ResidentsPage() {
  const { hostel } = useMyHostel();
  const { data: residents, loading } = useFetch(
    hostel ? () => studentApi.getAll(hostel.id) : null,
    [hostel]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [selected, setSelected] = useState<StudentBooking | null>(null);

  const floors = useMemo(() => {
    const set = new Set<string>();
    for (const r of residents ?? []) {
      const f = inferFloor(r.room.roomNumber);
      set.add(f === null ? "unassigned" : String(f));
    }
    return Array.from(set).sort((a, b) => {
      if (a === "unassigned") return 1;
      if (b === "unassigned") return -1;
      return Number(a) - Number(b);
    });
  }, [residents]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (residents ?? []).filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      if (floorFilter !== "ALL") {
        const f = inferFloor(r.room.roomNumber);
        const key = f === null ? "unassigned" : String(f);
        if (key !== floorFilter) return false;
      }

      if (!query) return true;
      // Searching a resident by their room number is as common as by name.
      return [r.user.name, r.user.email, r.user.phoneNumber, r.room.roomNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [residents, search, statusFilter, floorFilter]);

  const activeFilterCount =
    (statusFilter !== "ALL" ? 1 : 0) + (floorFilter !== "ALL" ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setFloorFilter("ALL");
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Residents"
        description="Everyone with a booking at your hostel"
        breadcrumbs={[{ label: "Residents" }, { label: "All residents" }]}
      />

      <Panel>
        <PanelHeader
          title="Register"
          description={
            loading
              ? "Loading…"
              : `${filtered.length} of ${residents?.length ?? 0} residents`
          }
          icon={Users}
        />

        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Name, phone, email or room…"
            className="w-full sm:w-64"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[8.5rem]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {floors.length > 1 && (
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="h-8 w-auto min-w-[8rem]" aria-label="Filter by floor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All floors</SelectItem>
                {floors.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f === "unassigned" ? "Unassigned" : floorLabel(Number(f))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <ActiveFilters count={activeFilterCount} onClear={clearFilters} />
        </Toolbar>

        {loading ? (
          <SkeletonTable rows={8} columns={6} />
        ) : filtered.length === 0 ? (
          residents && residents.length > 0 ? (
            <EmptyState
              icon={Users}
              title="No residents match these filters"
              description="Try a different search term, or clear the filters to see everyone."
            >
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Users}
              title="No residents yet"
              description="Once students book a room at your hostel, they'll be listed here with their room, stay dates and status."
            />
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 22rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Resident</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    onClick={() => setSelected(r)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(r);
                      }
                    }}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback>{initialsFromName(r.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {r.user.name || "Unnamed resident"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {r.user.phoneNumber ? formatPhone(r.user.phoneNumber) : "—"}
                    </TableCell>
                    <TableCell className="identifier">{r.room.roomNumber}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {floorLabel(inferFloor(r.room.roomNumber))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.checkIn)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.checkOut)}</TableCell>
                    <TableCell>
                      <StatusBadge registry={BOOKING_STATUS} value={r.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>

      <ResidentDrawer resident={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/**
 * Resident detail. Shows what the schema actually holds for a resident — their
 * identity, contact details and the stay itself. Sections the data can't
 * support (documents, complaints) are not stubbed out here.
 */
function ResidentDrawer({
  resident,
  onClose,
}: {
  resident: StudentBooking | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!resident} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{resident?.user.name || "Resident"}</SheetTitle>
        </SheetHeader>
        <SheetBody>
          {resident && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="text-sm">
                    {initialsFromName(resident.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {resident.user.name || "Unnamed resident"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    Room {resident.room.roomNumber} ·{" "}
                    {floorLabel(inferFloor(resident.room.roomNumber))}
                  </p>
                </div>
                <StatusBadge
                  registry={BOOKING_STATUS}
                  value={resident.status}
                  className="ml-auto shrink-0"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {resident.user.phoneNumber && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`tel:${resident.user.phoneNumber}`}>
                      <Phone className="size-3.5" />
                      Call
                    </a>
                  </Button>
                )}
                {resident.user.email && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${resident.user.email}`}>
                      <Mail className="size-3.5" />
                      Email
                    </a>
                  </Button>
                )}
              </div>

              <section>
                <h3 className="label-annotation mb-1">Stay</h3>
                <FieldList>
                  <Field label="Room">
                    <span className="identifier">{resident.room.roomNumber}</span>
                  </Field>
                  <Field label="Room type">{resident.room.roomType}</Field>
                  <Field label="Checked in">{formatDate(resident.checkIn)}</Field>
                  <Field label="Checks out">{formatDate(resident.checkOut)}</Field>
                </FieldList>
              </section>

              <section>
                <h3 className="label-annotation mb-1">Contact</h3>
                <FieldList>
                  <Field label="Phone">
                    {resident.user.phoneNumber ? formatPhone(resident.user.phoneNumber) : "—"}
                  </Field>
                  <Field label="Email">{resident.user.email || "—"}</Field>
                </FieldList>
              </section>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
