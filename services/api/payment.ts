import { apiClient } from "./client";

export const paymentApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number; hostelId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.hostelId) searchParams.append("hostelId", params.hostelId);

    const queryString = searchParams.toString();
    const data = await apiClient.get<{ payments?: any[] }>(
      `/api/payments${queryString ? `?${queryString}` : ""}`
    );
    return data.payments || [];
  },

  getById: (id: string) => apiClient.get<any>(`/api/payments/${id}`),

  // Starts a real payment: creates a PENDING Payment and returns a Stripe
  // Checkout URL to redirect the student to. The payment only becomes
  // COMPLETED once Stripe's webhook confirms it — never on this response.
  create: (paymentData: {
    bookingId: string;
    amount: number;
    method: string;
  }): Promise<{ payment: any; url: string }> =>
    apiClient.post(`/api/bookings/${paymentData.bookingId}/payments`, {
      amount: paymentData.amount,
      method: paymentData.method,
    }),

  // Resumes checkout for an existing PENDING payment (e.g. a previously
  // abandoned Stripe session) instead of creating a duplicate Payment row.
  resumeCheckout: (id: string): Promise<{ url: string }> =>
    apiClient.post(`/api/payments/${id}/checkout`),

  refund: (id: string, data?: { amount?: number; reason?: string }) =>
    apiClient.post<any>(`/api/payments/${id}/refund`, data || {}),
};
