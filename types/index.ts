import { Prisma } from "@prisma/client";

export enum HostelStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
}

export type User = {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  image?: string;
  role: "STUDENT" | "HOSTEL_ADMIN" | "SUPER_ADMIN";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Hostel = {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  images: string[];
  averageRating: number;
  reviewCount: number;
  availableRooms: number;
  lowestPrice: number;
  status: HostelStatus;
  totalRooms: number;
  rooms: {
    id: string;
    roomType: string;
    price: number;
    isAvailable: boolean;
  }[];
  admins?: User[];
  subscription?: Subscription;
};

export type HostelDetails = Prisma.HostelGetPayload<{
  include: {
    rooms: true;
    reviews: {
      include: {
        user: true;
      };
    };
  };
}> & {
  averageRating: number;
  reviewCount: number;
  availableRooms: number;
  lowestPrice: number;
  totalRooms: number;
};

export type Room = {
  id: string;
  roomNumber: string;
  roomType: string;
  description?: string;
  price: number;
  capacity: number;
  isAvailable: boolean;
  amenities: string[];
};

export type Review = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    image?: string;
  };
};

export type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    price: number;
    hostel: {
      id: string;
      name: string;
      city: string;
      state: string;
    };
  };
  payments: Payment[];
};

export type BookingDetails = Booking & {
  user: {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    image?: string;
  };
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    price: number;
    hostel: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
};

export type Payment = {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method?: string;
  createdAt: string;
  description?: string;
  dueDate?: string;
  refundedAmount?: number;
  refundReason?: string;
  booking?: BookingDetails;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "BOOKING" | "PAYMENT" | "SUBSCRIPTION" | "VERIFICATION" | "GENERAL";
  read: boolean;
  createdAt: string;
};

export type Subscription = {
  id: string;
  plan: "MONTHLY" | "YEARLY";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string;
  hostelId: string;
};

export type Wishlist = {
  id: string;
  hostelId: string;
  userId: string;
  createdAt: string;
};

export type HostelAdmin = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  hostels: Array<{ id: string; name?: string }>;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};
