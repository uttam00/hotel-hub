import { apiClient } from "./client";

export const subscriptionApi = {
  get: () => apiClient.get<any>("/api/hostel-admin/subscription"),

  checkout: (plan: "MONTHLY" | "YEARLY"): Promise<{ url: string }> =>
    apiClient.post("/api/hostel-admin/subscription", { plan }),
};
