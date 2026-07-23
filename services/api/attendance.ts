import { apiClient } from "./client";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";
export type AttendanceRecord = { studentId: string; status: AttendanceStatus };

export const attendanceApi = {
  getAll: (hostelId: string) => apiClient.get<AttendanceRecord[]>(`/api/hostel-admin/attendance?hostelId=${hostelId}`),

  mark: (data: { studentId: string; hostelId: string; date: string; status: AttendanceStatus }) =>
    apiClient.post<unknown>("/api/hostel-admin/attendance", data),

  scan: (data: { token: string; hostelId: string }) =>
    apiClient.post<{ student: { name: string } }>("/api/hostel-admin/attendance/scan", data),
};
