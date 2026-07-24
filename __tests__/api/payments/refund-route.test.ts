/// <reference types="jest" />
import { POST } from "@/app/api/payments/[id]/refund/route";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments";
import { logAudit } from "@/lib/audit";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    payment: { findUnique: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
  },
}));

jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/payments", () => ({
  paymentProvider: {
    refund: jest.fn(),
  },
}));

jest.mock("@/lib/audit", () => ({
  logAudit: jest.fn(),
}));

type AsyncMock = jest.MockedFunction<(...args: any[]) => Promise<any>>;

const mockedPrisma = prisma as unknown as {
  payment: { findUnique: AsyncMock; update: AsyncMock };
  notification: { create: AsyncMock };
};
const mockedGetCurrentUser = getCurrentUser as unknown as AsyncMock;
const mockedRefund = paymentProvider.refund as unknown as AsyncMock;
const mockedLogAudit = logAudit as unknown as AsyncMock;

const SUPER_ADMIN = { id: "sa-1", email: "sa@example.com", role: "SUPER_ADMIN" };
const HOSTEL_ADMIN_WITH_ACCESS = { id: "admin-1", email: "admin@example.com", role: "HOSTEL_ADMIN" };
const HOSTEL_ADMIN_NO_ACCESS = { id: "admin-2", email: "admin2@example.com", role: "HOSTEL_ADMIN" };
const STUDENT = { id: "user-1", email: "student@example.com", role: "STUDENT" };

function params(id = "pay-1") {
  return { params: Promise.resolve({ id }) };
}

function postRequest(body: unknown = {}) {
  return new Request("http://localhost/api/payments/pay-1/refund", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function makePayment(overrides: Partial<any> = {}) {
  return {
    id: "pay-1",
    amount: 500,
    status: "COMPLETED",
    stripePaymentIntentId: "pi_123",
    bookingId: "booking-1",
    booking: {
      userId: STUDENT.id,
      room: { hostel: { admins: [{ id: HOSTEL_ADMIN_WITH_ACCESS.id }] } },
    },
    ...overrides,
  };
}

describe("POST /api/payments/[id]/refund", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(401);
  });

  it("returns 404 when the payment does not exist", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    mockedPrisma.payment.findUnique.mockResolvedValue(null);

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(404);
  });

  it("returns 403 for a student", async () => {
    mockedGetCurrentUser.mockResolvedValue(STUDENT);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment());

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(403);
  });

  it("returns 403 for a hostel admin without access to the payment's hostel", async () => {
    mockedGetCurrentUser.mockResolvedValue(HOSTEL_ADMIN_NO_ACCESS);
    // The real prisma query filters `admins` down to the requesting user, so
    // an admin without access gets back an empty admins array here too.
    mockedPrisma.payment.findUnique.mockResolvedValue(
      makePayment({ booking: { userId: STUDENT.id, room: { hostel: { admins: [] } } } })
    );

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(403);
  });

  it("returns 400 when the payment isn't a completed, gateway-processed payment", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment({ status: "PENDING" }));

    const res = await POST(postRequest(), params());
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Only a completed, gateway-processed payment/);
  });

  it("returns 400 when the payment has no stripe payment intent", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    mockedPrisma.payment.findUnique.mockResolvedValue(
      makePayment({ stripePaymentIntentId: null })
    );

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid refund input", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    mockedPrisma.payment.findUnique.mockResolvedValue(makePayment());

    const res = await POST(postRequest({ amount: -5 }), params());

    expect(res.status).toBe(400);
  });

  it("allows a super admin to refund, records an audit log and notifies the student", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    const payment = makePayment();
    mockedPrisma.payment.findUnique.mockResolvedValue(payment);
    mockedRefund.mockResolvedValue({ refundId: "re_123" });
    const updated = { ...payment, status: "REFUNDED", refundedAmount: 500, refundReason: "requested" };
    mockedPrisma.payment.update.mockResolvedValue(updated);

    const res = await POST(postRequest({ amount: 500, reason: "requested" }), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockedRefund).toHaveBeenCalledWith({
      paymentIntentId: "pi_123",
      amount: 500,
      reason: "requested",
    });
    expect(mockedPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { status: "REFUNDED", refundedAmount: 500, refundReason: "requested" },
    });
    expect(mockedLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: SUPER_ADMIN.id, action: "PAYMENT_REFUNDED" })
    );
    expect(mockedPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: STUDENT.id, type: "PAYMENT" }) })
    );
    expect(json).toEqual(updated);
  });

  it("allows a hostel admin with access to refund", async () => {
    mockedGetCurrentUser.mockResolvedValue(HOSTEL_ADMIN_WITH_ACCESS);
    const payment = makePayment();
    mockedPrisma.payment.findUnique.mockResolvedValue(payment);
    mockedRefund.mockResolvedValue({ refundId: "re_123" });
    mockedPrisma.payment.update.mockResolvedValue({ ...payment, status: "REFUNDED" });

    const res = await POST(postRequest(), params());

    expect(res.status).toBe(200);
  });

  it("defaults the refunded amount to the full payment amount when none is given", async () => {
    mockedGetCurrentUser.mockResolvedValue(SUPER_ADMIN);
    const payment = makePayment({ amount: 750 });
    mockedPrisma.payment.findUnique.mockResolvedValue(payment);
    mockedRefund.mockResolvedValue({ refundId: "re_123" });
    mockedPrisma.payment.update.mockResolvedValue({ ...payment, status: "REFUNDED", refundedAmount: 750 });

    await POST(postRequest({}), params());

    expect(mockedPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { status: "REFUNDED", refundedAmount: 750, refundReason: undefined },
    });
  });
});
