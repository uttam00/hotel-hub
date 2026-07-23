import { apiClient } from "./client";

export type StudentBooking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  user: { id: string; name: string | null; email: string | null; phoneNumber: string | null };
  room: { id: string; roomNumber: string; roomType: string };
};

export const studentApi = {
  getAll: (hostelId: string) => apiClient.get<StudentBooking[]>(`/api/hostel-admin/students?hostelId=${hostelId}`),
};
