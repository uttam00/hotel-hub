import { apiClient } from "./client";
import type { Analytics } from "@/components/analytics/revenue-analytics";

export const analyticsApi = {
  getHostelAnalytics: (hostelId: string) =>
    apiClient.get<Analytics>(`/api/hostel-admin/analytics?hostelId=${hostelId}`),

  getPlatformAnalytics: () => apiClient.get<Analytics>("/api/super-admin/analytics"),
};
