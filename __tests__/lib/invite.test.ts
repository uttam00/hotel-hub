import { jest } from "@jest/globals";

import prisma from "@/lib/prisma";
import { consumeInviteToken, hashToken, lookupInviteToken } from "@/lib/invite";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    inviteToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

type AsyncMock = jest.MockedFunction<(...args: any[]) => Promise<any>>;

const mockedPrisma = prisma as unknown as {
  inviteToken: { findUnique: AsyncMock; updateMany: AsyncMock };
};

const RAW = "a".repeat(64);
const future = () => new Date(Date.now() + 60 * 60 * 1000);
const past = () => new Date(Date.now() - 60 * 60 * 1000);

const record = (over: Record<string, unknown> = {}) => ({
  id: "tok_1",
  tokenHash: hashToken(RAW),
  userId: "u_1",
  expiresAt: future(),
  usedAt: null,
  user: { id: "u_1", email: "warden@example.com", name: "Rahul Sharma" },
  ...over,
});

describe("hashToken", () => {
  it("is deterministic", () => {
    expect(hashToken(RAW)).toBe(hashToken(RAW));
  });

  it("does not reveal the token", () => {
    // Only the hash is ever stored, so a database leak yields nothing that can
    // be pasted into an invitation URL.
    expect(hashToken(RAW)).not.toContain(RAW);
    expect(hashToken(RAW)).toHaveLength(64);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken(RAW)).not.toBe(hashToken("b".repeat(64)));
  });
});

describe("lookupInviteToken", () => {
  it("rejects an empty token without touching the database", async () => {
    const result = await lookupInviteToken("");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockedPrisma.inviteToken.findUnique).not.toHaveBeenCalled();
  });

  it("looks the token up by hash, never by the raw value", async () => {
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(record());
    await lookupInviteToken(RAW);

    const arg = mockedPrisma.inviteToken.findUnique.mock.calls[0][0] as any;
    expect(arg.where.tokenHash).toBe(hashToken(RAW));
    expect(JSON.stringify(arg)).not.toContain(RAW);
  });

  it("accepts a live, unused token", async () => {
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(record());
    const result = await lookupInviteToken(RAW);
    expect(result).toMatchObject({ ok: true, tokenId: "tok_1" });
  });

  it("rejects an unknown token", async () => {
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(null);
    expect(await lookupInviteToken(RAW)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a token that has already been redeemed", async () => {
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(
      record({ usedAt: new Date() })
    );
    expect(await lookupInviteToken(RAW)).toEqual({ ok: false, reason: "used" });
  });

  it("rejects an expired token", async () => {
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(
      record({ expiresAt: past() })
    );
    expect(await lookupInviteToken(RAW)).toEqual({ ok: false, reason: "expired" });
  });

  it("reports 'used' ahead of 'expired' for a redeemed, expired token", async () => {
    // Both are refusals, but "already used" is the more accurate explanation.
    mockedPrisma.inviteToken.findUnique.mockResolvedValue(
      record({ usedAt: new Date(), expiresAt: past() })
    );
    expect(await lookupInviteToken(RAW)).toEqual({ ok: false, reason: "used" });
  });
});

describe("consumeInviteToken", () => {
  it("succeeds when the token is still unused", async () => {
    mockedPrisma.inviteToken.updateMany.mockResolvedValue({ count: 1 });
    expect(await consumeInviteToken("tok_1")).toBe(true);
  });

  it("filters on usedAt: null so redemption is a compare-and-set", async () => {
    // This is what makes two concurrent submissions of the same link produce
    // exactly one activation instead of two.
    mockedPrisma.inviteToken.updateMany.mockResolvedValue({ count: 1 });
    await consumeInviteToken("tok_1");

    const arg = mockedPrisma.inviteToken.updateMany.mock.calls[0][0] as any;
    expect(arg.where).toMatchObject({ id: "tok_1", usedAt: null });
  });

  it("fails when another request already consumed it", async () => {
    mockedPrisma.inviteToken.updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeInviteToken("tok_1")).toBe(false);
  });
});
