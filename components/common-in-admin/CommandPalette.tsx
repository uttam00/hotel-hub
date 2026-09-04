"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { CornerDownLeft, DoorOpen, Search, User, Wallet } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { getNavItems } from "@/components/common-in-admin/nav-config";
import { useOptionalHostelContext } from "@/contexts/hostel-context";
import { roomApi, studentApi } from "@/services/api";
import type { HostelRoom } from "@/services/api/room";
import type { StudentBooking } from "@/services/api/student";
import { deriveRoomOccupancy } from "@/lib/occupancy";
import { formatPhone } from "@/lib/format";

/**
 * Global search (§19), on ⌘K / Ctrl-K.
 *
 * Searches what actually exists: navigation, residents (via their bookings) and
 * rooms. Payments are reachable through the resident, which is how someone
 * actually looks for one ("what does Rahul owe?") rather than by payment id.
 *
 * Data is fetched once when the palette first opens and reused afterwards, so
 * typing is filtering-in-memory rather than a request per keystroke. Residents
 * and rooms are the two datasets small enough for that to be the right call at
 * hostel scale (hundreds, not millions).
 */
export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [residents, setResidents] = React.useState<StudentBooking[]>([]);
  const [rooms, setRooms] = React.useState<HostelRoom[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  // Hostel context only exists inside the hostel-admin section; the palette is
  // also used by super admins and students, where entity search doesn't apply.
  const hostelCtx = useOptionalHostelContext();
  const hostelId = hostelCtx?.selectedHostel?.id ?? null;

  const navItems = React.useMemo(() => getNavItems(role), [role]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load searchable entities lazily — nobody pays for this until they search.
  React.useEffect(() => {
    if (!open || loaded || !hostelId || role !== Role.HOSTEL_ADMIN) return;
    let cancelled = false;

    Promise.allSettled([studentApi.getAll(hostelId), roomApi.getByHostel(hostelId)]).then(
      ([residentsRes, roomsRes]) => {
        if (cancelled) return;
        if (residentsRes.status === "fulfilled") setResidents(residentsRes.value ?? []);
        if (roomsRes.status === "fulfilled") setRooms(roomsRes.value ?? []);
        setLoaded(true);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [open, loaded, hostelId, role]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // One row per resident, not one per booking — a resident with three stays
  // should appear once.
  const uniqueResidents = React.useMemo(() => {
    const seen = new Map<string, StudentBooking>();
    for (const booking of residents) {
      if (booking.user?.id && !seen.has(booking.user.id)) seen.set(booking.user.id, booking);
    }
    return Array.from(seen.values());
  }, [residents]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search residents, rooms and pages…" />
      <CommandList>
        <CommandEmpty>
          <div className="px-2 py-6 text-center">
            <Search className="mx-auto mb-2 size-5 text-faint" />
            <p className="text-sm text-muted-foreground">No matches.</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Go to">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.label} ${item.hint ?? ""}`}
              onSelect={() => go(item.href)}
            >
              <item.icon className="text-muted-foreground" />
              <span>{item.label}</span>
              {item.hint && (
                <span className="truncate text-xs text-muted-foreground">{item.hint}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        {uniqueResidents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Residents">
              {uniqueResidents.slice(0, 50).map((booking) => (
                <CommandItem
                  key={booking.user.id}
                  value={`${booking.user.name ?? ""} ${booking.user.email ?? ""} ${
                    booking.user.phoneNumber ?? ""
                  } ${booking.room.roomNumber}`}
                  onSelect={() => go(`/hostel-admin/students?resident=${booking.user.id}`)}
                >
                  <User className="text-muted-foreground" />
                  <span className="truncate">{booking.user.name || booking.user.email}</span>
                  <CommandShortcut>
                    Room {booking.room.roomNumber}
                    {booking.user.phoneNumber ? ` · ${formatPhone(booking.user.phoneNumber)}` : ""}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {rooms.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Rooms">
              {rooms.slice(0, 50).map((room) => {
                const occ = deriveRoomOccupancy(room);
                return (
                  <CommandItem
                    key={room.id}
                    value={`room ${room.roomNumber} ${room.roomName ?? ""} ${room.roomType}`}
                    onSelect={() => go(`/hostel-admin/occupancy?room=${room.id}`)}
                  >
                    <DoorOpen className="text-muted-foreground" />
                    <span className="identifier">Room {room.roomNumber}</span>
                    <CommandShortcut>
                      {occ.available > 0
                        ? `${occ.available} free of ${occ.capacity}`
                        : `Full · ${occ.capacity} places`}
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {role === Role.HOSTEL_ADMIN && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem
                value="record payment collect due"
                onSelect={() => go("/hostel-admin/payments")}
              >
                <Wallet className="text-muted-foreground" />
                Record a payment
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-sunken px-3 py-1.5 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CornerDownLeft className="size-3" /> to open
        </span>
        <span>esc to close</span>
      </div>
    </CommandDialog>
  );
}
