import { apiClient } from "./client";

export type HostelRoom = {
  id: string;
  roomNumber: string;
  roomType: string;
  isAvailable: boolean;
};

export const roomApi = {
  getByHostel: (hostelId: string) => apiClient.get<HostelRoom[]>(`/api/hostels/${hostelId}/rooms`),
};
