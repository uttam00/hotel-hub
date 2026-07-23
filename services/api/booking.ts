import { PaginatedResponse } from "@/types";
import { apiClient } from "./client";

export const bookingApi = {
  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const data = await apiClient.get<{ bookings: any[]; pagination: any }>(
      `/api/bookings${queryString ? `?${queryString}` : ""}`
    );
    return { data: data.bookings, pagination: data.pagination };
  },

  getById: (id: string) => apiClient.get<any>(`/api/bookings/${id}`),

  create: (bookingData: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
  }) => apiClient.post<any>("/api/bookings", bookingData),

  update: (
    id: string,
    bookingData: Partial<{
      status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
      checkIn: string;
      checkOut: string;
      totalPrice: number;
    }>
  ) => apiClient.put<any>(`/api/bookings/${id}`, bookingData),

  cancel: (id: string) => apiClient.delete<unknown>(`/api/bookings/${id}`),

  transfer: (id: string, newRoomId: string) =>
    apiClient.post<unknown>(`/api/bookings/${id}/transfer`, { newRoomId }),
};
