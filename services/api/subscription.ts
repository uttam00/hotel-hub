import { apiClient } from "./client";

export const subscriptionApi = {
  get: (hostelId?: string) =>
    apiClient.get<any>(`/api/hostel-admin/subscription${hostelId ? `?hostelId=${hostelId}` : ""}`),

  checkout: (plan: "MONTHLY" | "YEARLY", hostelId?: string): Promise<{ url: string }> =>
    apiClient.post("/api/hostel-admin/subscription", { plan, hostelId }),
};
