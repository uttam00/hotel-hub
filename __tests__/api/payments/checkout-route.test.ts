import { jest } from "@jest/globals";
import { POST } from "@/app/api/payments/[id]/checkout/route";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    payment: { findUnique: jest.fn() },
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
  payment: { findUnique: AsyncMock };
};
const mockedGetCurrentUser = getCurrentUser as unknown as AsyncMock;
const mockedCreateCheckout = paymentProvider.createBookingPaymentCheckout as unknown as AsyncMock;

const STUDENT = { id: "user-1", email: "student@example.com", role: "STUDENT" };
const OTHER_STUDENT = { id: "user-2", email: "other@example.com", role: "STUDENT" };

function params(id = "pay-1") {
  return { params: Promise.resolve({ id }) };
}

function makePayment(overrides: Partial<any> = {}) {
  return {
    id: "pay-1",
    amount: 500,
    status: "PENDING",
    bookingId: "booking-1",
    description: "Rent payment for booking booking-1",
    booking: { userId: STUDENT.id },
    ...overrides,
  };
}

describe("POST /api/payments/[id]/checkout", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const res = await POST(new Request("http://localhost"), params());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the payment does not exist", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.payment.findUnique.mockResolvedValue(null);

    const res = await POST(new Request("http://localhost"), params());

    expect(res.status).toBe(404);
  });

  it("returns 403 when the payment does not belong to the requester", async () => {
    mockedGetCurrentUser.mockResolvedValue(OTHER_STUDENT);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment());

    const res = await POST(new Request("http://localhost"), params());

    expect(res.status).toBe(403);
  });

  it("returns 400 when the payment is not PENDING", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment({ status: "COMPLETED" }));

    const res = await POST(new Request("http://localhost"), params());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Only a pending payment/);
  });

  it("resumes checkout for a pending payment without creating a new one", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment());
    mockedCreateCheckout.mockResolvedValue({ url: "https://stripe.test/resume" });

    const res = await POST(new Request("http://localhost"), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ url: "https://stripe.test/resume" });
    expect(mockedCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay-1", amount: 500, customerEmail: STUDENT.email })
    );
  });
});
