import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { expenseSchema } from "@/lib/validation_schema";

// GET expenses for a hostel, plus a total-by-category summary for the same set
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required" }, { status: 400 });
    }
    await requireHostelAccess(user.id, user.role, hostelId);

    const month = searchParams.get("month"); // "YYYY-MM"
    const dateFilter = month
      ? {
          date: {
            gte: new Date(`${month}-01T00:00:00.000Z`),
            lt: new Date(new Date(`${month}-01T00:00:00.000Z`).setMonth(new Date(`${month}-01`).getMonth() + 1)),
          },
        }
      : {};

    const expenses = await prisma.expense.findMany({
      where: { hostelId, ...dateFilter },
      orderBy: { date: "desc" },
    });

    const byCategory = await prisma.expense.groupBy({
      by: ["category"],
      where: { hostelId, ...dateFilter },
      _sum: { amount: true },
    });

    return NextResponse.json({
      expenses,
      summary: byCategory.map((c) => ({ category: c.category, total: c._sum.amount || 0 })),
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

const createExpenseSchema = expenseSchema.extend({ hostelId: z.string().min(1) });

// POST record a new expense
export async function POST(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN", "SUPER_ADMIN");

    const body = createExpenseSchema.parse(await req.json());
    await requireHostelAccess(user.id, user.role, body.hostelId);

    const expense = await prisma.expense.create({
      data: { ...body, recordedBy: user.id },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error recording expense:", error);
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
