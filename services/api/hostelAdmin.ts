import { apiClient } from "./client";

export type HostelAdminStats = {
  totalStudents: number;
  totalBookings: number;
  totalRooms: number;

  /** Collections. `collectionTrendPct` is null when last month had none. */
  collectedToday: number;
  paymentsToday: number;
  collectedThisMonth: number;
  collectedLastMonth: number;
  collectionTrendPct: number | null;

  /** Dues. `overdue*` is the subset of outstanding that is past its due date. */
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;

  /** Today's operations pulse. */
  arrivalsToday: number;
  departuresToday: number;
  visitorsOnPremises: number;

  expensesThisMonth: number;
  netThisMonth: number;

  activeNotices: number;
  waitlistWaiting: number;
};

export type HostelSubscriptionSummary = {
  id: string;
  name: string;
  accessLevel: "FULL" | "LIMITED";
  subscription: { plan: "MONTHLY" | "YEARLY"; status: "ACTIVE" | "EXPIRED" | "CANCELLED"; endDate: string } | null;
};

export const hostelAdminApi = {
  getMyHostel: () => apiClient.get<{ id: string; name: string } | null>("/api/hostel-admin/me"),
  getMyHostels: () => apiClient.get<{ id: string; name: string }[]>("/api/hostel-admin/my-hostels"),
  getStats: (hostelId: string) =>
    apiClient.get<HostelAdminStats>(`/api/hostel-admin/stats?hostelId=${hostelId}`),
  getMySubscriptions: () =>
    apiClient.get<HostelSubscriptionSummary[]>("/api/hostel-admin/subscriptions"),
};
