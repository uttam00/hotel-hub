import { apiClient } from "./client";

export type Notice = { id: string; title: string; body: string; pinned: boolean; createdAt: string };

export const noticeApi = {
  getAll: (hostelId: string) => apiClient.get<Notice[]>(`/api/hostels/${hostelId}/notices`),

  create: (hostelId: string, data: { title: string; body: string; pinned: boolean }) =>
    apiClient.post<Notice>(`/api/hostels/${hostelId}/notices`, data),

  remove: (hostelId: string, noticeId: string) =>
    apiClient.delete<unknown>(`/api/hostels/${hostelId}/notices/${noticeId}`),
};
