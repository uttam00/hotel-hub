import prisma from "@/lib/prisma";
import type { RoomType } from "@prisma/client";

/** Notifies the longest-waiting student for a freed-up room type, if anyone is waiting. */
export async function notifyNextWaiting(hostelId: string, roomType: RoomType) {
  const entry = await prisma.waitlistEntry.findFirst({
    where: { hostelId, roomType, status: "WAITING" },
    orderBy: { requestedAt: "asc" },
  });
  if (!entry) return;

  await prisma.waitlistEntry.update({
    where: { id: entry.id },
    data: { status: "NOTIFIED", notifiedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      title: "A room just opened up",
      message: `A ${roomType.toLowerCase()} room is now available at the hostel you're waitlisted for.`,
      type: "GENERAL",
      userId: entry.studentId,
    },
  });
}
