import { apiClient } from "./client";

export const wishlistApi = {
  toggle: (hostelId: string) =>
    apiClient.post<{ action: "added" | "removed" }>("/api/wishlist", { hostelId }),
};
