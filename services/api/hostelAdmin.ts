import { apiClient } from "./client";

export type HostelAdminStats = {
  totalStudents: number;
  totalBookings: number;
  totalPayments: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
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
