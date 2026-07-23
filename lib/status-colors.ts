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
