import { createHmac, timingSafeEqual } from "crypto";

function sign(studentId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(studentId).digest("hex").slice(0, 32);
}

/** Token encoded into a student's personal QR code — verifiable, but not guessable without the server secret. */
export function generateStudentToken(studentId: string): string {
  return `${studentId}.${sign(studentId)}`;
}

export function verifyStudentToken(token: string): string | null {
  const [studentId, signature] = token.split(".");
  if (!studentId || !signature) return null;

  const expected = sign(studentId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return studentId;
}
