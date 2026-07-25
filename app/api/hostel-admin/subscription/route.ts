import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole, requireHostelAccess, authzErrorResponse } from "@/lib/authz";
import { getHostelAccessLevel } from "@/lib/subscription";
import { paymentProvider } from "@/lib/payments";

// GET the current hostel admin's hostel, subscription, and access level.
// Accepts an optional ?hostelId= so the selected hostel (from the hostel
// selector) is what billing reflects, not just whichever hostel is first.
export async function GET(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN");
    const hostelId = new URL(req.url).searchParams.get("hostelId");

    if (hostelId) await requireHostelAccess(user.id, user.role, hostelId);

    const hostel = await prisma.hostel.findFirst({
      where: hostelId
        ? { id: hostelId }
        : { admins: { some: { id: user.id } } },
      include: { subscription: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "No hostel found for this admin" }, { status: 404 });
    }

    const accessLevel = await getHostelAccessLevel(hostel.id);

    return NextResponse.json({
      hostel: { id: hostel.id, name: hostel.name },
      subscription: hostel.subscription,
      accessLevel,
    });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

const checkoutSchema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
  hostelId: z.string().optional(),
});

// POST start (or renew) a subscription checkout for the admin's hostel.
export async function POST(req: Request) {
  try {
    const user = await requireRole("HOSTEL_ADMIN");

    const { plan, hostelId } = checkoutSchema.parse(await req.json());

    if (hostelId) await requireHostelAccess(user.id, user.role, hostelId);

    const hostel = await prisma.hostel.findFirst({
      where: hostelId
        ? { id: hostelId }
        : { admins: { some: { id: user.id } } },
    });

    if (!hostel) {
      return NextResponse.json({ error: "No hostel found for this admin" }, { status: 404 });
    }
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const { url } = await paymentProvider.createSubscriptionCheckout({
      hostelId: hostel.id,
      plan,
      customerEmail: user.email!,
      successUrl: `${baseUrl}/hostel-admin/billing?checkout=success`,
      cancelUrl: `${baseUrl}/hostel-admin/billing?checkout=cancelled`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.flatten() }, { status: 400 });
    }

    console.error("Error creating subscription checkout:", error);
    return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
  }
}
