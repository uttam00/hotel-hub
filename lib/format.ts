/**
 * Formatting for an Indian hostel operation.
 *
 * Money is INR throughout, and Indian digit grouping (2,2,3) is not what
 * `Intl` gives you by default — `en-IN` is required or ₹1,04,500 renders as
 * ₹104,500, which reads wrong to every user of this product.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_PRECISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("en-IN");

/** ₹8,500 — the default for tables and detail rows. */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return INR.format(value);
}

/** ₹8,500.00 — for receipts and reconciliation, where paise matter. */
export function formatCurrencyPrecise(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return INR_PRECISE.format(value);
}

/**
 * ₹4.82L / ₹1.2Cr — lakh-crore shorthand for KPI tiles, where the exact rupee
 * is noise and the magnitude is the point. Indian users read "4.82L" far
 * faster than "482,000", and "482K" is not how anyone here speaks.
 */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

/** 1,04,500 — Indian grouping without the currency symbol. */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return NUM.format(value);
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
});

const TIME = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 04 Sep 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? DATE.format(d) : "—";
}

/** 04 Sep — for columns where the year is implied by the filter. */
export function formatDateShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? DATE_SHORT.format(d) : "—";
}

/** 10:42 am */
export function formatTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? TIME.format(d) : "—";
}

/** 04 Sep 2026, 10:42 am */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? `${DATE.format(d)}, ${TIME.format(d)}` : "—";
}

/**
 * "Today", "Yesterday", "3 days ago" — used by the activity timeline, where
 * recency matters more than the exact date.
 */
export function formatRelativeDay(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";

  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days === -1) return "Tomorrow";
  if (days > 1 && days < 7) return `${days} days ago`;
  if (days < -1 && days > -7) return `In ${Math.abs(days)} days`;
  return DATE.format(d);
}

/**
 * Whole days from today until `value`; negative when past. Drives "due in 3
 * days" / "12 days overdue" copy on payments and checkouts.
 */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const d = toDate(value);
  if (!d) return null;
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
}

/** Phone numbers stored as +91XXXXXXXXXX read better as +91 98765 43210. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/[^\d+]/g, "");
  const m = digits.match(/^(\+91)?(\d{5})(\d{5})$/);
  return m ? `${m[1] ? "+91 " : ""}${m[2]} ${m[3]}` : value;
}

/** Initials for an avatar fallback, from a display name. */
export function initialsFromName(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** SCREAMING_SNAKE enum -> "Screaming snake", for labels with no registry. */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return "—";
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Good morning" / "Good afternoon" / "Good evening" for the dashboard hero. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
