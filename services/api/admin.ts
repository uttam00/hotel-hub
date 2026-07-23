import { apiClient } from "./client";

export const adminApi = {
  getAll: () => apiClient.get<any>("/api/super-admin/admins"),

  getByHostel: (hostelId: string) => apiClient.get<any>(`/api/super-admin/hostels/${hostelId}`),

  create: (adminData: { name: string; email: string }) =>
    apiClient.post<any>("/api/super-admin/admins", adminData),

  delete: (adminId: string) => apiClient.delete<unknown>(`/api/super-admin/admins/${adminId}`),

  assignHostel: (adminId: string, hostelIds: string[]) =>
    apiClient.post<unknown>(`/api/super-admin/admins/${adminId}/assign-hostel`, { hostelIds }),

  unassignHostel: (adminId: string, hostelId: string) =>
    apiClient.delete<unknown>(`/api/super-admin/admins/${adminId}/assign-hostel/${hostelId}`),
};
