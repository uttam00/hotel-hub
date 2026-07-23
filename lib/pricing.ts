import { differenceInCalendarDays } from "date-fns";

/**
 * Authoritative booking price: monthly room rate prorated by nights.
 * Never trust a client-supplied total — always recompute from this.
 */
export function calculateBookingPrice(
  pricePerMonth: number,
  checkIn: Date,
  checkOut: Date
): number {
  const nights = differenceInCalendarDays(checkOut, checkIn);
  return Math.round(nights * (pricePerMonth / 30) * 100) / 100;
}
