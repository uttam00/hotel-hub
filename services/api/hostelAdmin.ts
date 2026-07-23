import { apiClient } from "./client";

export const hostelAdminApi = {
  getMyHostel: () => apiClient.get<{ id: string; name: string } | null>("/api/hostel-admin/me"),
};
