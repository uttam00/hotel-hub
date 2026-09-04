import { addPeriod, renewalEndDate } from "@/lib/billing";

/**
 * The renewal arithmetic that a replayed webhook used to corrupt.
 *
 * Before this, `handleSubscriptionCheckout` set `endDate` to now + one period
 * on every delivery, so a duplicate `checkout.session.completed` — which Stripe
 * sends routinely, since delivery is at-least-once — silently granted an extra
 * billing period.
 */
describe("addPeriod", () => {
  it("adds a month for the monthly plan", () => {
    expect(addPeriod("MONTHLY", new Date("2026-01-15T00:00:00Z")).toISOString()).toBe(
      new Date("2026-02-15T00:00:00Z").toISOString()
    );
  });

  it("adds a year for the yearly plan", () => {
    expect(addPeriod("YEARLY", new Date("2026-01-15T00:00:00Z")).toISOString()).toBe(
      new Date("2027-01-15T00:00:00Z").toISOString()
    );
  });

  it("does not mutate the date it is given", () => {
    const original = new Date("2026-01-15T00:00:00Z");
    addPeriod("MONTHLY", original);
    expect(original.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });
});

describe("renewalEndDate", () => {
  const now = new Date("2026-06-01T12:00:00Z");

  it("extends from the existing end date when renewing early", () => {
    // 20 days still on the clock: renewing must add a month to *that*, not
    // throw the remaining days away.
    const currentEnd = new Date("2026-06-21T12:00:00Z");
    expect(renewalEndDate("MONTHLY", currentEnd, now).toISOString()).toBe(
      new Date("2026-07-21T12:00:00Z").toISOString()
    );
  });

  it("starts from today when the subscription has already lapsed", () => {
    const lapsed = new Date("2026-05-01T12:00:00Z");
    expect(renewalEndDate("MONTHLY", lapsed, now).toISOString()).toBe(
      new Date("2026-07-01T12:00:00Z").toISOString()
    );
  });

  it("starts from today for a first-time subscription", () => {
    expect(renewalEndDate("MONTHLY", null, now).toISOString()).toBe(
      new Date("2026-07-01T12:00:00Z").toISOString()
    );
    expect(renewalEndDate("YEARLY", undefined, now).toISOString()).toBe(
      new Date("2027-06-01T12:00:00Z").toISOString()
    );
  });

  it("never shortens an existing term", () => {
    const currentEnd = new Date("2027-01-01T00:00:00Z");
    const result = renewalEndDate("MONTHLY", currentEnd, now);
    expect(result.getTime()).toBeGreaterThan(currentEnd.getTime());
  });
});
