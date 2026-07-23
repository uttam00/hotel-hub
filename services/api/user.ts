import { apiClient } from "./client";

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
};

export const userApi = {
  update: (userData: { id: string; name: string; phoneNumber: string; image: string }) =>
    apiClient.put<unknown>("/api/profile", userData),

  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    apiClient.post<{ message: string }>("/api/change-password", data),

  getEmergencyContacts: () =>
    apiClient.get<EmergencyContact[]>("/api/profile/emergency-contacts"),

  addEmergencyContact: (data: { name: string; phone: string; relation: string; isPrimary: boolean }) =>
    apiClient.post<EmergencyContact>("/api/profile/emergency-contacts", data),

  removeEmergencyContact: (id: string) =>
    apiClient.delete<unknown>(`/api/profile/emergency-contacts/${id}`),
};
