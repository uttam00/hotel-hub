import { apiClient } from "./client";

export const reviewApi = {
  create: (hostelId: string, data: { rating: number; comment?: string }) =>
    apiClient.post<unknown>(`/api/hostels/${hostelId}/reviews`, data),
};
