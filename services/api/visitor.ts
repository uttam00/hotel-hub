import { apiClient } from "./client";

export type Visitor = {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  checkInAt: string;
  checkOutAt: string | null;
  visitingStudent: { name: string | null; email: string | null };
};

export const visitorApi = {
  getAll: (hostelId: string) => apiClient.get<Visitor[]>(`/api/hostel-admin/visitors?hostelId=${hostelId}`),

  log: (data: { name: string; phone: string; purpose: string; visitingStudentId: string; hostelId: string }) =>
    apiClient.post<Visitor>("/api/hostel-admin/visitors", data),

  checkOut: (id: string) =>
    apiClient.patch<unknown>(`/api/hostel-admin/visitors/${id}`, { checkOut: true }),
};
