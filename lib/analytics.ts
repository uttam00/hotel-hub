import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Last 6 months of completed-payment revenue, bucketed by month. */
export async function getRevenueTrend(where: Prisma.PaymentWhereInput) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { ...where, status: "COMPLETED", createdAt: { gte: sixMonthsAgo } },
    select: { amount: true, createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }

  for (const payment of payments) {
    const key = `${payment.createdAt.getFullYear()}-${String(payment.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + payment.amount);
    }
  }

  return Array.from(buckets.entries()).map(([month, total]) => ({ month, total }));
}
