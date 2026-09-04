import {
  deriveRoomOccupancy,
  groupByFloor,
  inferFloor,
  isBookingActive,
  summarise,
  type RoomLike,
} from "@/lib/occupancy";

// A fixed "now" so the active/upcoming boundaries are deterministic.
const NOW = new Date("2026-09-04T12:00:00.000Z");

const booking = (
  id: string,
  status: string,
  checkIn: string,
  checkOut: string,
  name?: string
) => ({
  id,
  status,
  checkIn,
  checkOut,
  user: name ? { name } : null,
});

const room = (over: Partial<RoomLike> = {}): RoomLike => ({
  id: "r1",
  roomNumber: "204",
  roomType: "DOUBLE",
  capacity: 4,
  price: 8500,
  status: "AVAILABLE",
  bookings: [],
  ...over,
});

describe("inferFloor", () => {
  it("reads the floor from common room-number conventions", () => {
    expect(inferFloor("204")).toBe(2);
    expect(inferFloor("1204")).toBe(12);
    expect(inferFloor("12")).toBe(1);
    expect(inferFloor("4")).toBe(0);
  });

  it("honours explicit ground-floor markers", () => {
    expect(inferFloor("G-04")).toBe(0);
    expect(inferFloor("GF-11")).toBe(0);
    expect(inferFloor("ground 2")).toBe(0);
  });

  it("ignores a block or wing prefix", () => {
    expect(inferFloor("A-201")).toBe(2);
    expect(inferFloor("Block C 305")).toBe(3);
  });

  it("returns null rather than guessing when there is no number", () => {
    // Grouped under "Unassigned" in the UI — silently calling this floor 0
    // would put it on the ground floor of the plan, which would be a lie.
    expect(inferFloor("Annexe")).toBeNull();
    expect(inferFloor("")).toBeNull();
  });
});

describe("isBookingActive", () => {
  it("counts a stay that spans today", () => {
    expect(
      isBookingActive(booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01"), NOW)
    ).toBe(true);
  });

  it("does not count a stay that has ended or not begun", () => {
    expect(
      isBookingActive(booking("b1", "CONFIRMED", "2026-01-01", "2026-02-01"), NOW)
    ).toBe(false);
    expect(
      isBookingActive(booking("b2", "CONFIRMED", "2026-11-01", "2026-12-01"), NOW)
    ).toBe(false);
  });

  it("ignores cancelled and completed bookings even if the dates span today", () => {
    expect(
      isBookingActive(booking("b1", "CANCELLED", "2026-08-01", "2026-12-01"), NOW)
    ).toBe(false);
    expect(
      isBookingActive(booking("b2", "COMPLETED", "2026-08-01", "2026-12-01"), NOW)
    ).toBe(false);
  });
});

describe("deriveRoomOccupancy", () => {
  it("splits capacity into occupied, reserved and available places", () => {
    const result = deriveRoomOccupancy(
      room({
        bookings: [
          booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01", "Rahul Sharma"),
          booking("b2", "CONFIRMED", "2026-07-15", "2026-11-30", "Aditya Nair"),
          booking("b3", "CONFIRMED", "2026-10-01", "2027-03-01", "Priya Menon"),
        ],
      }),
      NOW
    );

    expect(result.occupied).toBe(2);
    expect(result.reserved).toBe(1);
    expect(result.available).toBe(1);
    expect(result.slots).toHaveLength(4);
    expect(result.slots.map((s) => s.state)).toEqual([
      "occupied",
      "occupied",
      "reserved",
      "available",
    ]);
    expect(result.occupancyRate).toBe(75);
  });

  it("names the occupant of an occupied slot", () => {
    const result = deriveRoomOccupancy(
      room({
        capacity: 1,
        bookings: [booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01", "Rahul Sharma")],
      }),
      NOW
    );
    expect(result.slots[0].occupant?.name).toBe("Rahul Sharma");
  });

  it("reports every slot as out of service for a room under maintenance", () => {
    // Even with no bookings, a room being repaired must never read as bookable.
    const result = deriveRoomOccupancy(room({ status: "MAINTENANCE" }), NOW);
    expect(result.available).toBe(0);
    expect(result.slots.every((s) => s.state === "maintenance")).toBe(true);
  });

  it("marks an inactive room as blocked", () => {
    const result = deriveRoomOccupancy(room({ status: "INACTIVE" }), NOW);
    expect(result.slots.every((s) => s.state === "blocked")).toBe(true);
  });

  it("never reports more occupants than the room physically holds", () => {
    // Guards against overbooking in the data producing a negative availability.
    const result = deriveRoomOccupancy(
      room({
        capacity: 2,
        bookings: [
          booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01"),
          booking("b2", "CONFIRMED", "2026-08-01", "2026-12-01"),
          booking("b3", "CONFIRMED", "2026-08-01", "2026-12-01"),
        ],
      }),
      NOW
    );
    expect(result.occupied).toBe(2);
    expect(result.available).toBe(0);
    expect(result.slots).toHaveLength(2);
  });

  it("orders slots deterministically", () => {
    const bookings = [
      booking("b2", "CONFIRMED", "2026-08-01", "2026-12-01", "Second"),
      booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01", "First"),
    ];
    const a = deriveRoomOccupancy(room({ capacity: 2, bookings }), NOW);
    const b = deriveRoomOccupancy(room({ capacity: 2, bookings: [...bookings].reverse() }), NOW);
    expect(a.slots.map((s) => s.occupant?.name)).toEqual(b.slots.map((s) => s.occupant?.name));
  });
});

describe("groupByFloor", () => {
  it("groups rooms by inferred floor, highest first, with unassigned last", () => {
    const groups = groupByFloor(
      [
        room({ id: "a", roomNumber: "101" }),
        room({ id: "b", roomNumber: "305" }),
        room({ id: "c", roomNumber: "Annexe" }),
        room({ id: "d", roomNumber: "102" }),
      ],
      NOW
    );

    expect(groups.map((g) => g.label)).toEqual([
      "3rd floor",
      "1st floor",
      "Unassigned",
    ]);
    expect(groups[1].rooms).toHaveLength(2);
  });

  it("sorts rooms within a floor numerically, not lexically", () => {
    const groups = groupByFloor(
      [room({ id: "a", roomNumber: "210" }), room({ id: "b", roomNumber: "209" })],
      NOW
    );
    expect(groups[0].rooms.map((r) => r.room.roomNumber)).toEqual(["209", "210"]);
  });
});

describe("summarise", () => {
  it("excludes out-of-service places from the occupancy denominator", () => {
    // 4 sellable places, 2 taken => 50%, despite 4 more beds being unavailable.
    const result = summarise(
      [
        room({
          id: "a",
          roomNumber: "101",
          capacity: 4,
          bookings: [
            booking("b1", "CONFIRMED", "2026-08-01", "2026-12-01"),
            booking("b2", "CONFIRMED", "2026-08-01", "2026-12-01"),
          ],
        }),
        room({ id: "b", roomNumber: "102", capacity: 4, status: "MAINTENANCE" }),
      ],
      NOW
    );

    expect(result.totalCapacity).toBe(8);
    expect(result.outOfService).toBe(4);
    expect(result.occupied).toBe(2);
    expect(result.occupancyRate).toBe(50);
  });

  it("reports a zero rate rather than dividing by zero when there are no rooms", () => {
    const result = summarise([], NOW);
    expect(result.occupancyRate).toBe(0);
    expect(result.totalRooms).toBe(0);
  });
});
