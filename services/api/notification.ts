import { apiClient } from "./client";

export const notificationApi = {
  getAll: async (params?: { unread?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.unread) searchParams.append("unread", "true");

    const queryString = searchParams.toString();
    const data = await apiClient.get<{ notifications?: any[] }>(
      `/api/notifications${queryString ? `?${queryString}` : ""}`
    );
    return data.notifications || [];
  },

  getById: (id: string) => apiClient.get<any>(`/api/notifications/${id}`),

  create: (data: any) => apiClient.post<any>("/api/notifications", data),

  markAsRead: (id: string) => apiClient.post<any>(`/api/notifications/${id}`),

  delete: (notificationId: string) => apiClient.delete<unknown>(`/api/notifications/${notificationId}`),
};
