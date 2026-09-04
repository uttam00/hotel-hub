"use client";

import { useMemo, useState } from "react";
import { ListPlus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
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
import { Toolbar } from "@/components/ui/toolbar";
import { ROOM_TYPE, StatusBadge, WAITLIST_STATUS } from "@/components/ui/status-badge";
import { useFetch } from "@/hooks/use-fetch";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { waitlistApi } from "@/services/api";
import { formatDate, formatRelativeDay, initialsFromName } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "WAITING", label: "Waiting" },
  { value: "NOTIFIED", label: "Notified" },
  { value: "FULFILLED", label: "Placed" },
  { value: "CANCELLED", label: "Cancelled" },
];

/**
 * The waiting list — demand you can't currently house. Ordered oldest-first so
 * the person who has waited longest is at the top, which is the fair reading
 * and the one an operator needs when a room frees up.
 */
export default function WaitlistPage() {
  const { hostel } = useMyHostel();
  const { data: entries, loading } = useFetch(
    hostel ? () => waitlistApi.getAll(hostel.id) : null,
    [hostel]
  );
  const [statusFilter, setStatusFilter] = useState("WAITING");

  const filtered = useMemo(() => {
    const list =
      statusFilter === "ALL"
        ? (entries ?? [])
        : (entries ?? []).filter((e) => e.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()
    );
  }, [entries, statusFilter]);

  const waitingCount = (entries ?? []).filter((e) => e.status === "WAITING").length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Waiting list"
        description="Students waiting for a place to open up"
        breadcrumbs={[{ label: "Residents" }, { label: "Waiting list" }]}
      />

      <Panel>
        <PanelHeader
          title="Queue"
          description={
            loading ? "Loading…" : `${waitingCount} still waiting · longest wait first`
          }
          icon={ListPlus}
        />

        <Toolbar>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[9rem]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All entries</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Toolbar>

        {loading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : filtered.length === 0 ? (
          statusFilter === "WAITING" ? (
            <EmptyState
              icon={ListPlus}
              title="Nobody is waiting"
              description="Every student who wanted a place has one. Students join this list when the room type they want is full."
            />
          ) : (
            <EmptyState
              icon={ListPlus}
              title="No entries with this status"
              description="Try a different status to see the rest of the queue."
            />
          )
        ) : (
          <TableScroller maxHeight="calc(100vh - 22rem)">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12" numeric>
                    #
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Wants</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Waiting</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, i) => (
                  <TableRow key={entry.id}>
                    <TableCell numeric className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback>
                            {initialsFromName(entry.student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {entry.student.name || "Unnamed"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {entry.student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        registry={ROOM_TYPE}
                        value={entry.roomType}
                        size="sm"
                        showIcon={false}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(entry.requestedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRelativeDay(entry.requestedAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge registry={WAITLIST_STATUS} value={entry.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScroller>
        )}
      </Panel>
    </div>
  );
}
