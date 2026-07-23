import { apiClient } from "./client";

export type WaitlistEntry = {
  id: string;
  roomType: string;
  status: string;
  requestedAt: string;
  student: { name: string | null; email: string | null };
};

export const waitlistApi = {
  getAll: (hostelId: string) => apiClient.get<WaitlistEntry[]>(`/api/hostels/${hostelId}/waitlist`),

  join: (hostelId: string, roomType: string) =>
    apiClient.post<WaitlistEntry>(`/api/hostels/${hostelId}/waitlist`, { roomType }),
};
