import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  DoorOpen,
  Hourglass,
  LogOut,
  Minus,
  Plane,
  RotateCcw,
  Undo2,
  Wrench,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The single source of truth for entity status across the console.
 *
 * Every status is defined once as { label, icon, tone } and rendered the same
 * way everywhere. Three rules drive the design:
 *
 *  1. Never colour alone (§16, §33). Each badge carries an icon and a written
 *     label, so it survives greyscale printing and colour-blindness.
 *  2. Human labels, not enum names. The database says `PENDING_VERIFICATION`;
 *     a warden reads "Awaiting review".
 *  3. Derived statuses are first-class. `OVERDUE` is not a PaymentStatus in the
 *     schema — it is a PENDING payment past its dueDate — but operationally it
 *     is the most important state there is, so it gets its own entry.
 *
 * This replaces lib/status-colors.ts, which returned raw `bg-green-100
 * text-green-800` pairs: those bypassed the token system, had no dark-mode
 * equivalent for half the cases, and conveyed meaning through hue only.
 */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

const TONE_CLASS: Record<Tone, string> = {
  success: "border-success-border bg-success-subtle text-success",
  warning: "border-warning-border bg-warning-subtle text-warning",
  danger: "border-danger-border bg-danger-subtle text-danger",
  info: "border-info-border bg-info-subtle text-info",
  neutral: "border-neutral-border bg-neutral-subtle text-neutral",
  brand: "border-primary-border bg-primary-subtle text-primary",
};

/** Solid dot colours, for dense contexts (table cells, the occupancy legend). */
const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
  brand: "bg-primary",
};

export interface StatusDef {
  label: string;
  icon: LucideIcon;
  tone: Tone;
  /** Optional one-line explanation, surfaced as a title attribute. */
  hint?: string;
}

type Registry = Record<string, StatusDef>;

/** Payment — includes the derived OVERDUE and PARTIAL states. */
export const PAYMENT_STATUS: Registry = {
  COMPLETED: { label: "Paid", icon: CheckCircle2, tone: "success" },
  PARTIAL: { label: "Partially paid", icon: CircleDot, tone: "info" },
  PENDING: { label: "Pending", icon: Clock, tone: "warning" },
  OVERDUE: {
    label: "Overdue",
    icon: AlertTriangle,
    tone: "danger",
    hint: "Due date has passed",
  },
  FAILED: { label: "Failed", icon: XCircle, tone: "danger" },
  REFUNDED: { label: "Refunded", icon: Undo2, tone: "neutral" },
};

/** Booking / stay lifecycle. */
export const BOOKING_STATUS: Registry = {
  CONFIRMED: { label: "Confirmed", icon: CheckCircle2, tone: "success" },
  PENDING: { label: "Pending", icon: Hourglass, tone: "warning" },
  CANCELLED: { label: "Cancelled", icon: Ban, tone: "neutral" },
  COMPLETED: { label: "Checked out", icon: LogOut, tone: "info" },
};

/** Room state. Occupied is deliberately "brand", not "success" — a full room
 *  is the goal, but it is a fact rather than a good/bad judgement. */
export const ROOM_STATUS: Registry = {
  AVAILABLE: { label: "Available", icon: DoorOpen, tone: "success" },
  OCCUPIED: { label: "Occupied", icon: CircleDot, tone: "brand" },
  MAINTENANCE: { label: "Maintenance", icon: Wrench, tone: "warning" },
  INACTIVE: { label: "Inactive", icon: CircleDashed, tone: "neutral" },
};

export const ATTENDANCE_STATUS: Registry = {
  PRESENT: { label: "Present", icon: Check, tone: "success" },
  ABSENT: { label: "Absent", icon: XCircle, tone: "danger" },
  LEAVE: { label: "On leave", icon: Plane, tone: "info" },
};

export const VISITOR_STATUS: Registry = {
  ON_PREMISES: { label: "On premises", icon: CircleDot, tone: "success" },
  CHECKED_OUT: { label: "Checked out", icon: LogOut, tone: "neutral" },
};

export const VERIFICATION_STATUS: Registry = {
  VERIFIED: { label: "Verified", icon: CheckCircle2, tone: "success" },
  PENDING: { label: "Awaiting review", icon: Clock, tone: "warning" },
  REJECTED: { label: "Rejected", icon: XCircle, tone: "danger" },
};

export const WAITLIST_STATUS: Registry = {
  WAITING: { label: "Waiting", icon: Hourglass, tone: "warning" },
  NOTIFIED: { label: "Notified", icon: CalendarClock, tone: "info" },
  FULFILLED: { label: "Placed", icon: CheckCircle2, tone: "success" },
  CANCELLED: { label: "Cancelled", icon: Ban, tone: "neutral" },
};

export const HOSTEL_STATUS: Registry = {
  ACTIVE: { label: "Active", icon: CheckCircle2, tone: "success" },
  INACTIVE: { label: "Inactive", icon: CircleDashed, tone: "neutral" },
  PENDING_VERIFICATION: {
    label: "Awaiting review",
    icon: Clock,
    tone: "warning",
    hint: "Not yet visible to students",
  },
};

export const SUBSCRIPTION_STATUS: Registry = {
  ACTIVE: { label: "Active", icon: CheckCircle2, tone: "success" },
  EXPIRED: { label: "Expired", icon: AlertTriangle, tone: "danger" },
  CANCELLED: { label: "Cancelled", icon: Ban, tone: "neutral" },
};

export const EXPENSE_CATEGORY: Registry = {
  UTILITIES: { label: "Utilities", icon: CircleDot, tone: "info" },
  SALARY: { label: "Salary", icon: CircleDot, tone: "brand" },
  MAINTENANCE: { label: "Maintenance", icon: Wrench, tone: "warning" },
  SUPPLIES: { label: "Supplies", icon: CircleDot, tone: "success" },
  OTHER: { label: "Other", icon: Minus, tone: "neutral" },
};

export const ROOM_TYPE: Registry = {
  SINGLE: { label: "Single", icon: Building2, tone: "neutral" },
  DOUBLE: { label: "Double", icon: Building2, tone: "neutral" },
  TRIPLE: { label: "Triple", icon: Building2, tone: "neutral" },
  DORMITORY: { label: "Dormitory", icon: Building2, tone: "neutral" },
  CUSTOM: { label: "Custom", icon: Building2, tone: "neutral" },
};

const FALLBACK: StatusDef = { label: "Unknown", icon: CircleDashed, tone: "neutral" };

/** Turns an enum value into its definition, tolerating unexpected values. */
export function resolveStatus(registry: Registry, value: string | null | undefined): StatusDef {
  if (!value) return FALLBACK;
  return (
    registry[value] ?? {
      ...FALLBACK,
      // Last resort: make an unmapped enum readable rather than shouting.
      label: value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " "),
    }
  );
}

export function StatusBadge({
  registry,
  value,
  size = "default",
  showIcon = true,
  className,
}: {
  registry: Registry;
  value: string | null | undefined;
  size?: "default" | "sm";
  showIcon?: boolean;
  className?: string;
}) {
  const { label, icon: Icon, tone, hint } = resolveStatus(registry, value);
  return (
    <span
      title={hint}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border font-medium",
        size === "sm" ? "px-1 py-0 text-2xs" : "px-1.5 py-0.5 text-xs",
        TONE_CLASS[tone],
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "size-2.5" : "size-3")} />}
      {label}
    </span>
  );
}

/**
 * The quietest form: a dot plus a label. For table columns where a full badge
 * on every row would create a wall of boxes.
 */
export function StatusDot({
  registry,
  value,
  showLabel = true,
  className,
}: {
  registry: Registry;
  value: string | null | undefined;
  showLabel?: boolean;
  className?: string;
}) {
  const { label, tone, hint } = resolveStatus(registry, value);
  return (
    <span
      title={hint ?? label}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", className)}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])} />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}

/**
 * Resolves a payment to its *operational* status rather than its stored one:
 * a PENDING payment whose dueDate has passed is OVERDUE, which is the thing an
 * accountant actually needs to see.
 */
export function derivePaymentStatus(payment: {
  status: string;
  dueDate?: string | Date | null;
}): string {
  if (payment.status === "PENDING" && payment.dueDate) {
    const due = new Date(payment.dueDate);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return "OVERDUE";
  }
  return payment.status;
}

export { TONE_CLASS, TONE_DOT };
