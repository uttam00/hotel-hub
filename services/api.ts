import { PaginatedResponse } from "@/types";
import { Hostel } from "@prisma/client";

// Base URL for API calls - changes based on environment
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Client-side: use relative URL
    return "";
  }
  // Server-side: use absolute URL
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

// Auth APIs — login itself goes through next-auth's signIn() client-side
// (see components/auth/login-form.tsx), not a route here.
export const authApi = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error("Registration failed");
    return response.json();
  },
};

// User APIs

export const userApi = {
  update: async (userData: {
    id: string;
    name: string;
    phoneNumber: string;
    image: string;
  }) => {
    const response = await fetch(`${getBaseUrl()}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    return response.json();
  },
};

// Hostel APIs
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
    const url = `${getBaseUrl()}/api/hostels${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch hostels");
    const data = await response.json();
    return {
      data: data.hostels,
      pagination: data.pagination,
    };
  },

  getById: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/hostels/${id}`);
    if (!response.ok) throw new Error("Failed to fetch hostel");
    return response.json();
  },

  create: async (hostelData: {
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    amenities: string[];
  }) => {
    const response = await fetch(`${getBaseUrl()}/api/hostels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hostelData),
    });
    if (!response.ok) throw new Error("Failed to create hostel");
    return response.json();
  },

  update: async (
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
  ) => {
    const response = await fetch(`${getBaseUrl()}/api/hostels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hostelData),
    });
    if (!response.ok) throw new Error("Failed to update hostel");
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/hostels/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete hostel");
    return response.json();
  },
};

// Admin APIs
export const adminApi = {
  getAll: async () => {
    const response = await fetch(`${getBaseUrl()}/api/super-admin/admins`);
    if (!response.ok) {
      throw new Error("Failed to fetch admins");
    }
    return response.json();
  },

  getByHostel: async (hostelId: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/super-admin/hostels/${hostelId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch hostel admins");
    }
    return response.json();
  },

  create: async (adminData: { name: string; email: string }) => {
    const response = await fetch(`${getBaseUrl()}/api/super-admin/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    return response.json();
  },

  delete: async (adminId: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/super-admin/admins/${adminId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete admin");
    }
    return response.json();
  },

  assignHostel: async (adminId: string, hostelIds: string[]) => {
    const response = await fetch(
      `${getBaseUrl()}/api/super-admin/admins/${adminId}/assign-hostel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostelIds }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to assign hostel");
    }
    return response.json();
  },

  unassignHostel: async (adminId: string, hostelId: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/super-admin/admins/${adminId}/assign-hostel/${hostelId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to unassign hostel");
    }
    return response.json();
  },
};

// Booking APIs
export const bookingApi = {
  getAll: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const url = `${getBaseUrl()}/api/bookings${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch bookings");
    const data = await response.json();
    return {
      data: data.bookings,
      pagination: data.pagination,
    };
  },

  getById: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/bookings/${id}`);
    if (!response.ok) throw new Error("Failed to fetch booking");
    return response.json();
  },

  create: async (bookingData: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
  }) => {
    const response = await fetch(`${getBaseUrl()}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error("Failed to create booking");
    return response.json();
  },

  update: async (
    id: string,
    bookingData: Partial<{
      status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
      checkIn: string;
      checkOut: string;
      totalPrice: number;
    }>
  ) => {
    const response = await fetch(`${getBaseUrl()}/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error("Failed to update booking");
    return response.json();
  },

  cancel: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/bookings/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to cancel booking");
    return response.json();
  },
};

// Payment APIs
export const paymentApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const url = `${getBaseUrl()}/api/payments${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch payments");
    const data = await response.json();
    return data.payments || [];
  },

  getById: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/payments/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch payment");
    }
    return response.json();
  },

  // Starts a real payment: creates a PENDING Payment and returns a Stripe
  // Checkout URL to redirect the student to. The payment only becomes
  // COMPLETED once Stripe's webhook confirms it — never on this response.
  create: async (paymentData: {
    bookingId: string;
    amount: number;
    method: string;
  }): Promise<{ payment: any; url: string }> => {
    const response = await fetch(
      `${getBaseUrl()}/api/bookings/${paymentData.bookingId}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paymentData.amount, method: paymentData.method }),
      }
    );
    if (!response.ok) throw new Error("Failed to start payment");
    return response.json();
  },

  // Resumes checkout for an existing PENDING payment (e.g. a previously
  // abandoned Stripe session) instead of creating a duplicate Payment row.
  resumeCheckout: async (id: string): Promise<{ url: string }> => {
    const response = await fetch(`${getBaseUrl()}/api/payments/${id}/checkout`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to start checkout");
    return response.json();
  },

  refund: async (id: string, data?: { amount?: number; reason?: string }) => {
    const response = await fetch(`${getBaseUrl()}/api/payments/${id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!response.ok) throw new Error("Failed to process refund");
    return response.json();
  },
};

// Hostel Admin subscription/billing APIs
export const subscriptionApi = {
  get: async () => {
    const response = await fetch(`${getBaseUrl()}/api/hostel-admin/subscription`);
    if (!response.ok) throw new Error("Failed to fetch subscription");
    return response.json();
  },

  checkout: async (plan: "MONTHLY" | "YEARLY"): Promise<{ url: string }> => {
    const response = await fetch(`${getBaseUrl()}/api/hostel-admin/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) throw new Error("Failed to start checkout");
    return response.json();
  },
};

// Notification APIs
export const notificationApi = {
  getAll: async (params?: { unread?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.unread) searchParams.append("unread", "true");

    const queryString = searchParams.toString();
    const url = `${getBaseUrl()}/api/notifications${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch notifications");
    const data = await response.json();
    return data.notifications || [];
  },

  getById: async (id: string) => {
    const response = await fetch(`${getBaseUrl()}/api/notifications/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notification");
    }
    return response.json();
  },

  create: async (data: any) => {
    const response = await fetch(`${getBaseUrl()}/api/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create notification");
    }
    return response.json();
  },

  markAsRead: async (id: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/notifications/${id}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }
    return response.json();
  },

  delete: async (notificationId: string) => {
    const response = await fetch(
      `${getBaseUrl()}/api/notifications/${notificationId}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete notification");
  },
};
