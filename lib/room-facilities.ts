// Fixed set of optional room facility keys, stored as plain strings inside
// Room.amenities (same array column/pattern already used for Hostel.amenities).
// "geyser" is included here but rendered by RoomCard next to the bathroom/AC
// controls rather than in the generic facilities grid — UI grouping only,
// it still lives in this same amenities array.
export const ADDITIONAL_FACILITIES = [
  { key: "study_table", label: "Study Table" },
  { key: "chair", label: "Chair" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "geyser", label: "Geyser" },
  { key: "balcony", label: "Balcony" },
  { key: "window", label: "Window" },
  { key: "drinking_water", label: "Drinking Water" },
  { key: "power_backup", label: "Power Backup" },
] as const;

export type FacilityKey = (typeof ADDITIONAL_FACILITIES)[number]["key"];

export const GEYSER_KEY: FacilityKey = "geyser";
