import { apiClient } from "./client";
import type { AccountStatus, HostelAdmin } from "@/types";

export const adminApi = {
  getAll: () => apiClient.get<HostelAdmin[]>("/api/super-admin/admins"),

  getByHostel: (hostelId: string) => apiClient.get<any>(`/api/super-admin/hostels/${hostelId}`),

  /**
   * Creates an invited admin. No password is sent or generated — the server
   * emails a single-use link and the admin chooses their own.
   */
  create: (adminData: { name: string; email: string; hostelIds?: string[] }) =>
    apiClient.post<HostelAdmin & { emailSent: boolean }>(
      "/api/super-admin/admins",
      adminData
    ),

  /** Activate / deactivate, or re-issue an invitation. */
  update: (
    adminId: string,
    data: { status?: Exclude<AccountStatus, "PENDING">; resendInvite?: boolean }
  ) =>
    apiClient.patch<{ success: boolean; emailSent?: boolean }>(
      `/api/super-admin/admins/${adminId}`,
      data
    ),

  delete: (adminId: string) => apiClient.delete<unknown>(`/api/super-admin/admins/${adminId}`),

  assignHostel: (adminId: string, hostelIds: string[]) =>
    apiClient.post<unknown>(`/api/super-admin/admins/${adminId}/assign-hostel`, { hostelIds }),

  unassignHostel: (adminId: string, hostelId: string) =>
    apiClient.delete<unknown>(`/api/super-admin/admins/${adminId}/assign-hostel/${hostelId}`),
};
