import { apiClient } from "./client";

export type HostelAdminStats = {
  totalStudents: number;
  totalBookings: number;
  totalPayments: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
};

export const hostelAdminApi = {
  getMyHostel: () => apiClient.get<{ id: string; name: string } | null>("/api/hostel-admin/me"),
  getMyHostels: () => apiClient.get<{ id: string; name: string }[]>("/api/hostel-admin/my-hostels"),
  getStats: (hostelId: string) =>
    apiClient.get<HostelAdminStats>(`/api/hostel-admin/stats?hostelId=${hostelId}`),
};
