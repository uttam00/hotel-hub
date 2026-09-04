/**
 * Occupancy derivation.
 *
 * IMPORTANT CONTEXT: the schema has no Bed model and no Floor model. A Room has
 * `roomNumber`, `capacity` and `status`; occupancy comes from the Bookings
 * attached to it. Everything below is therefore *derived*, not stored, and the
 * derivation rules are kept in this one file so the dashboard, the occupancy
 * plan and the room list can never disagree about what "occupied" means.
 *
 * Two consequences worth knowing when reading the UI:
 *
 *  - Beds have no identity. We know a room has 4 places and 3 are taken; we
 *    cannot say a given resident is in "204-B", because nothing stores that.
 *    The UI therefore shows *slots*, never named beds.
 *  - Floors are inferred from the room number's numbering convention. That is a
 *    convention, not a guarantee, so `floorLabel` degrades gracefully and rooms
 *    that don't parse are grouped under "Unassigned" rather than silently
 *    landing on floor 0.
 */

export type SlotState = "occupied" | "reserved" | "available" | "maintenance" | "blocked";

export interface BookingLike {
  id: string;
  status: string;
  checkIn: string | Date;
  checkOut: string | Date;
  user?: { id?: string; name?: string | null; email?: string | null } | null;
}

export interface RoomLike {
  id: string;
  roomNumber: string;
  roomName?: string | null;
  roomType: string;
  capacity: number;
  price: number;
  status: string;
  bookings?: BookingLike[];
}

export interface Slot {
  /** Position within the room (1-based). Not a stored bed identifier. */
  position: number;
  state: SlotState;
  occupant?: { name: string; bookingId: string; until: Date } | null;
}

export interface RoomOccupancy {
  room: RoomLike;
  floor: number | null;
  floorLabel: string;
  capacity: number;
  occupied: number;
  reserved: number;
  available: number;
  slots: Slot[];
  /** 0–100, counting reserved places as taken since they are not sellable. */
  occupancyRate: number;
}

/**
 * Whether a booking currently holds a place in the room.
 *
 * A booking occupies a place only while the stay is live — a completed or
 * future booking must not make a bed look taken today. Cancelled and completed
 * bookings never hold a place.
 */
export function isBookingActive(booking: BookingLike, at: Date = new Date()): boolean {
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return false;
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return false;
  return checkIn <= at && checkOut >= at;
}

/** A confirmed booking that hasn't started yet still blocks the place. */
export function isBookingUpcoming(booking: BookingLike, at: Date = new Date()): boolean {
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return false;
  const checkIn = new Date(booking.checkIn);
  return !Number.isNaN(checkIn.getTime()) && checkIn > at;
}

/**
 * Infers the floor from the room number.
 *
 * Handles the conventions actually used by Indian hostels:
 *   "204"    -> 2      (3 digits: leading digits are the floor)
 *   "1204"   -> 12
 *   "12"     -> 1      (2 digits: first digit is the floor)
 *   "G-04"   -> 0      (explicit ground-floor prefix)
 *   "A-201"  -> 2      (block prefix ignored)
 *   "Annexe" -> null   (unparseable: grouped separately, not forced to 0)
 */
export function inferFloor(roomNumber: string): number | null {
  if (!roomNumber) return null;
  const raw = roomNumber.trim();

  // Explicit ground-floor markers take priority over digit parsing.
  if (/^(g|gf|ground)\b/i.test(raw)) return 0;

  // Drop a leading block/wing prefix such as "A-", "B ", "Block C ".
  const withoutPrefix = raw.replace(/^(block\s*)?[A-Za-z]{1,2}[\s\-_/]*/i, "");
  const digits = withoutPrefix.match(/\d+/)?.[0];
  if (!digits) return null;

  if (digits.length >= 3) return parseInt(digits.slice(0, digits.length - 2), 10);
  if (digits.length === 2) return parseInt(digits[0], 10);
  // A single-digit room number ("4") is a ground-floor room by convention.
  return 0;
}

export function floorLabel(floor: number | null): string {
  if (floor === null) return "Unassigned";
  if (floor === 0) return "Ground floor";
  const suffix =
    floor % 100 >= 11 && floor % 100 <= 13
      ? "th"
      : floor % 10 === 1
      ? "st"
      : floor % 10 === 2
      ? "nd"
      : floor % 10 === 3
      ? "rd"
      : "th";
  return `${floor}${suffix} floor`;
}

/**
 * Expands a room into its slots.
 *
 * Rooms flagged MAINTENANCE or INACTIVE report every slot in that state rather
 * than as available — an out-of-service room must never look bookable, even if
 * it happens to have no bookings attached.
 */
export function deriveRoomOccupancy(room: RoomLike, at: Date = new Date()): RoomOccupancy {
  const capacity = Math.max(0, room.capacity ?? 0);
  const floor = inferFloor(room.roomNumber);

  const outOfService: SlotState | null =
    room.status === "MAINTENANCE" ? "maintenance" : room.status === "INACTIVE" ? "blocked" : null;

  if (outOfService) {
    return {
      room,
      floor,
      floorLabel: floorLabel(floor),
      capacity,
      occupied: 0,
      reserved: 0,
      available: 0,
      slots: Array.from({ length: capacity }, (_, i) => ({
        position: i + 1,
        state: outOfService,
        occupant: null,
      })),
      occupancyRate: 0,
    };
  }

  const bookings = room.bookings ?? [];
  // Sorted by id so slot order is stable between renders — without a Bed model
  // there is no natural ordering, and a shuffling plan would be unreadable.
  const active = bookings.filter((b) => isBookingActive(b, at)).sort((a, b) => a.id.localeCompare(b.id));
  const upcoming = bookings
    .filter((b) => isBookingUpcoming(b, at))
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

  // Never report more taken places than the room physically has.
  const occupied = Math.min(active.length, capacity);
  const reserved = Math.min(upcoming.length, Math.max(0, capacity - occupied));
  const available = Math.max(0, capacity - occupied - reserved);

  const slots: Slot[] = [];
  for (let i = 0; i < occupied; i++) {
    const b = active[i];
    slots.push({
      position: slots.length + 1,
      state: "occupied",
      occupant: {
        name: b.user?.name || b.user?.email || "Resident",
        bookingId: b.id,
        until: new Date(b.checkOut),
      },
    });
  }
  for (let i = 0; i < reserved; i++) {
    const b = upcoming[i];
    slots.push({
      position: slots.length + 1,
      state: "reserved",
      occupant: {
        name: b.user?.name || b.user?.email || "Reserved",
        bookingId: b.id,
        until: new Date(b.checkIn),
      },
    });
  }
  for (let i = 0; i < available; i++) {
    slots.push({ position: slots.length + 1, state: "available", occupant: null });
  }

  return {
    room,
    floor,
    floorLabel: floorLabel(floor),
    capacity,
    occupied,
    reserved,
    available,
    slots,
    occupancyRate: capacity > 0 ? ((occupied + reserved) / capacity) * 100 : 0,
  };
}

export interface FloorGroup {
  floor: number | null;
  label: string;
  rooms: RoomOccupancy[];
  capacity: number;
  occupied: number;
  reserved: number;
  available: number;
  occupancyRate: number;
}

/** Groups rooms into floors, highest floor first — as a building elevation is
 *  drawn, with the ground at the bottom. */
export function groupByFloor(rooms: RoomLike[], at: Date = new Date()): FloorGroup[] {
  const derived = rooms.map((r) => deriveRoomOccupancy(r, at));
  const byFloor = new Map<string, RoomOccupancy[]>();

  for (const room of derived) {
    const key = room.floor === null ? "unassigned" : String(room.floor);
    if (!byFloor.has(key)) byFloor.set(key, []);
    byFloor.get(key)!.push(room);
  }

  const groups: FloorGroup[] = Array.from(byFloor.entries()).map(([key, list]) => {
    const floor = key === "unassigned" ? null : Number(key);
    const capacity = list.reduce((s, r) => s + r.capacity, 0);
    const occupied = list.reduce((s, r) => s + r.occupied, 0);
    const reserved = list.reduce((s, r) => s + r.reserved, 0);
    const available = list.reduce((s, r) => s + r.available, 0);
    return {
      floor,
      label: floorLabel(floor),
      // Natural room-number order within a floor (204 before 210, not "10"<"9").
      rooms: list.sort((a, b) =>
        a.room.roomNumber.localeCompare(b.room.roomNumber, undefined, { numeric: true })
      ),
      capacity,
      occupied,
      reserved,
      available,
      occupancyRate: capacity > 0 ? ((occupied + reserved) / capacity) * 100 : 0,
    };
  });

  return groups.sort((a, b) => {
    if (a.floor === null) return 1;
    if (b.floor === null) return -1;
    return b.floor - a.floor;
  });
}

export interface OccupancySummary {
  totalRooms: number;
  totalCapacity: number;
  occupied: number;
  reserved: number;
  available: number;
  outOfService: number;
  occupancyRate: number;
}

export function summarise(rooms: RoomLike[], at: Date = new Date()): OccupancySummary {
  const derived = rooms.map((r) => deriveRoomOccupancy(r, at));
  const totalCapacity = derived.reduce((s, r) => s + r.capacity, 0);
  const occupied = derived.reduce((s, r) => s + r.occupied, 0);
  const reserved = derived.reduce((s, r) => s + r.reserved, 0);
  const available = derived.reduce((s, r) => s + r.available, 0);
  const outOfService = derived
    .filter((r) => r.room.status === "MAINTENANCE" || r.room.status === "INACTIVE")
    .reduce((s, r) => s + r.capacity, 0);

  return {
    totalRooms: derived.length,
    totalCapacity,
    occupied,
    reserved,
    available,
    outOfService,
    // Out-of-service places are excluded from the denominator: a hostel with 20
    // beds of which 5 are being repaired is judged on the 15 it can actually
    // sell, otherwise repairs look like a collections failure.
    occupancyRate:
      totalCapacity - outOfService > 0
        ? ((occupied + reserved) / (totalCapacity - outOfService)) * 100
        : 0,
  };
}

export const SLOT_LABEL: Record<SlotState, string> = {
  occupied: "Occupied",
  reserved: "Reserved",
  available: "Available",
  maintenance: "Maintenance",
  blocked: "Blocked",
};
