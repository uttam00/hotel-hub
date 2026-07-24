import { jest } from "@jest/globals";
import { GET, POST } from "@/app/api/bookings/[id]/payments/route";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    booking: { findUnique: jest.fn() },
    payment: { findMany: jest.fn(), create: jest.fn() },
  },
}));

jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/payments", () => ({
  paymentProvider: {
    createBookingPaymentCheckout: jest.fn(),
  },
}));

type AsyncMock = jest.MockedFunction<(...args: any[]) => Promise<any>>;

const mockedPrisma = prisma as unknown as {
  booking: { findUnique: AsyncMock };
  payment: { findMany: AsyncMock; create: AsyncMock };
};
const mockedGetCurrentUser = getCurrentUser as unknown as AsyncMock;
const mockedCreateCheckout = paymentProvider.createBookingPaymentCheckout as unknown as AsyncMock;

const STUDENT = { id: "user-1", email: "student@example.com", role: "STUDENT" };
const OTHER_STUDENT = { id: "user-2", email: "other@example.com", role: "STUDENT" };
const HOSTEL_ADMIN = { id: "admin-1", email: "admin@example.com", role: "HOSTEL_ADMIN" };

function makeBooking(overrides: Partial<any> = {}) {
  return {
    id: "booking-1",
    userId: STUDENT.id,
    totalPrice: 1000,
    payments: [],
    room: { hostel: { admins: [] } },
    ...overrides,
  };
}

function params(id = "booking-1") {
  return { params: Promise.resolve({ id }) };
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/bookings/booking-1/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("GET /api/bookings/[id]/payments", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(401);
  });

  it("returns 404 when booking does not exist", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(404);
  });

  it("returns 403 when a student requests another student's booking", async () => {
    mockedGetCurrentUser.mockResolvedValue(OTHER_STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(403);
  });

  it("returns 403 when a hostel admin has no access to the booking's hostel", async () => {
    mockedGetCurrentUser.mockResolvedValue(HOSTEL_ADMIN);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());

    const res = await GET(new Request("http://localhost"), params());

    expect(res.status).toBe(403);
  });

  it("returns the payments list for the owning student", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());
    const payments = [{ id: "pay-1", amount: 500 }];
    mockedPrisma.payment.findMany.mockResolvedValue(payments);

    const res = await GET(new Request("http://localhost"), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(payments);
    expect(mockedPrisma.payment.findMany).toHaveBeenCalledWith({
      where: { bookingId: "booking-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/bookings/[id]/payments", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const res = await POST(postRequest({ amount: 100, method: "CARD" }), params());

    expect(res.status).toBe(401);
  });

  it("returns 404 when booking does not exist", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(null);

    const res = await POST(postRequest({ amount: 100, method: "CARD" }), params());

    expect(res.status).toBe(404);
  });

  it("returns 403 when the booking does not belong to the requester", async () => {
    mockedGetCurrentUser.mockResolvedValue(OTHER_STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());

    const res = await POST(postRequest({ amount: 100, method: "CARD" }), params());

    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid input", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());

    const res = await POST(postRequest({ amount: -5, method: "CARD" }), params());

    expect(res.status).toBe(400);
  });

  it("returns 400 when the payment would exceed the remaining balance", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(
      makeBooking({ totalPrice: 1000, payments: [{ status: "COMPLETED", amount: 900 }] })
    );

    const res = await POST(postRequest({ amount: 200, method: "CARD" }), params());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/exceeds remaining balance/);
  });

  it("creates a PENDING payment and returns the checkout url", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.booking.findUnique.mockResolvedValue(makeBooking());
    const createdPayment = {
      id: "pay-1",
      amount: 500,
      method: "CARD",
      status: "PENDING",
      bookingId: "booking-1",
      description: "Rent payment for booking booking-1",
    };
    mockedPrisma.payment.create.mockResolvedValue(createdPayment);
    mockedCreateCheckout.mockResolvedValue({ url: "https://stripe.test/checkout" });

    const res = await POST(postRequest({ amount: 500, method: "CARD" }), params());
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockedPrisma.payment.create).toHaveBeenCalledWith({
      data: {
        amount: 500,
        method: "CARD",
        status: "PENDING",
        bookingId: "booking-1",
        description: "Rent payment for booking booking-1",
      },
    });
    expect(mockedCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay-1", amount: 500, customerEmail: STUDENT.email })
    );
    expect(json).toEqual({ payment: createdPayment, url: "https://stripe.test/checkout" });
  });
});
