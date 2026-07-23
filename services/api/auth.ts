import { Role } from "@prisma/client";
import { apiClient } from "./client";

export const authApi = {
  register: (userData: { name: string; email: string; password: string; role?: string }) =>
    apiClient.post<{ id: string; email: string; role: Role }>("/api/auth/register", userData),

  // Fetches the full current-user record (role, image, phone, etc.) after a
  // successful next-auth signIn() — signIn() itself only returns a session
  // token, not the profile fields the app needs to route/render with.
  getCurrentUser: () =>
    apiClient.get<{
      id: string;
      email: string;
      role: Role;
      name: string | null;
      image: string | null;
      phoneNumber: string | null;
    }>("/api/auth/user"),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/api/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post<{ message: string }>("/api/auth/reset-password", data),
};
