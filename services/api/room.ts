import { apiClient } from "./client";

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "INACTIVE";
export type ACType = "FAN_ONLY" | "FAN_AC";
export type CupboardType = "INDIVIDUAL" | "SHARED" | "NONE";

export type HostelRoom = {
  id: string;
  roomNumber: string;
  roomName?: string | null;
  roomType: string;
  customRoomType?: string | null;
  description?: string | null;
  price: number;
  capacity: number;
  status: RoomStatus;
  hasAttachedBathroom: boolean;
  acType: ACType;
  cupboardType: CupboardType;
  amenities: string[];
};

export type RoomWriteData = Omit<HostelRoom, "id">;

export const roomApi = {
  getByHostel: (hostelId: string) => apiClient.get<HostelRoom[]>(`/api/hostels/${hostelId}/rooms`),

  create: (hostelId: string, data: Partial<RoomWriteData>) =>
    apiClient.post<HostelRoom>(`/api/hostels/${hostelId}/rooms`, data),

  update: (hostelId: string, roomId: string, data: Partial<RoomWriteData>) =>
    apiClient.put<HostelRoom>(`/api/hostels/${hostelId}/rooms/${roomId}`, data),

  delete: (hostelId: string, roomId: string) =>
    apiClient.delete<unknown>(`/api/hostels/${hostelId}/rooms/${roomId}`),
};
