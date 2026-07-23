import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireRole, authzErrorResponse } from "@/lib/authz";
import { generateStudentToken } from "@/lib/qr";

// GET the current student's personal check-in QR code as a data URL image.
export async function GET() {
  try {
    const user = await requireRole("STUDENT");

    const token = generateStudentToken(user.id);
    const dataUrl = await QRCode.toDataURL(token, { width: 320, margin: 2 });

    return NextResponse.json({ dataUrl });
  } catch (error) {
    const authzRes = authzErrorResponse(error);
    if (authzRes) return authzRes;
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
