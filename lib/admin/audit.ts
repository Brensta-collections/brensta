import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { assertAdmin } from "./rbac";
import type { Prisma } from "@prisma/client";

/**
 * Record a sensitive admin action. Omits any secret-like fields.
 * Keep before/after shapes small — don't dump entire relations.
 */
export async function recordAudit(args: {
  action: string;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}) {
  const user = await assertAdmin();
  const h = await headers();
  await prisma.adminAuditLog.create({
    data: {
      userId: user.id,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      before: args.before,
      after: args.after,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent") ?? null,
    },
  });
}

/** Strip fields that must never appear in audit entries. */
export function redactUser<T extends Record<string, unknown>>(u: T): Partial<T> {
  const copy: Record<string, unknown> = { ...u };
  delete copy.passwordHash;
  delete copy.resetToken;
  delete copy.token;
  return copy as Partial<T>;
}
