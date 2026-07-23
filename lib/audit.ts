import prisma from "@/lib/prisma";
import { Prisma, type Role } from "@prisma/client";

/** Records a sensitive action. Called only from mutations worth an audit trail — not every request. */
export async function logAudit(params: {
  actorId: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    },
  });
}
