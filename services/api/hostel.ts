import { PaginatedResponse } from "@/types";
import { Hostel } from "@prisma/client";
import { apiClient } from "./client";

export const hostelApi = {
  getAll: async (params?: {
    city?: string;
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string;
    sort?: string;
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.append("city", params.city);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.minPrice) searchParams.append("minPrice", params.minPrice.toString());
    if (params?.maxPrice) searchParams.append("maxPrice", params.maxPrice.toString());
    if (params?.amenities) searchParams.append("amenities", params.amenities);
    if (params?.sort) searchParams.append("sort", params.sort);

    const queryString = searchParams.toString();
    const data = await apiClient.get<{ hostels: any[]; pagination: any }>(
      `/api/hostels${queryString ? `?${queryString}` : ""}`
    );
    return { data: data.hostels, pagination: data.pagination };
  },

  getById: (id: string) => apiClient.get<any>(`/api/hostels/${id}`),

  create: (hostelData: {
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    amenities: string[];
  }) => apiClient.post<any>("/api/hostels", hostelData),

  update: (
    id: string,
    hostelData: Partial<{
      name: string;
      description: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      amenities: string[];
      status: Hostel["status"];
    }>
  ) => apiClient.put<any>(`/api/hostels/${id}`, hostelData),

  delete: (id: string) => apiClient.delete<unknown>(`/api/hostels/${id}`),
};
