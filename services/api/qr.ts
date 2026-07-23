import { apiClient } from "./client";

export const qrApi = {
  getMyCode: () => apiClient.get<{ dataUrl: string }>("/api/dashboard/qr-code"),
};
