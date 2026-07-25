export function getBookingStatusColor(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "FAILED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "REFUNDED":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// A PENDING payment whose dueDate has passed — not a stored enum value
// (PaymentStatus has no OVERDUE case), so callers compute this themselves
// and use amber to stay distinct from PENDING's yellow.
export const OVERDUE_COLOR = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";

// Solid hex equivalents of getPaymentStatusColor's palette, for contexts
// (recharts fills) that can't take a Tailwind class.
export const PAYMENT_STATUS_CHART_COLORS: Record<string, string> = {
  COMPLETED: "#22c55e",
  PENDING: "#eab308",
  FAILED: "#ef4444",
  REFUNDED: "#a855f7",
};

export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "ABSENT":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "LEAVE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Visitor status is derived (checkOutAt set or not), never stored as an enum.
export function getVisitorStatusColor(status: "ON_PREMISES" | "CHECKED_OUT"): string {
  switch (status) {
    case "ON_PREMISES":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "CHECKED_OUT":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getWaitlistStatusColor(status: string): string {
  switch (status) {
    case "WAITING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "NOTIFIED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "FULFILLED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRoomStatusColor(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "OCCUPIED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "MAINTENANCE":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getExpenseCategoryColor(category: string): string {
  switch (category) {
    case "UTILITIES":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "SALARY":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "MAINTENANCE":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "SUPPLIES":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
    case "OTHER":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
