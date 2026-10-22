"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";

const ALLOWED_KEYS = [
  "contact.email",
  "contact.phone",
  "contact.whatsapp",
  "contact.address",
  "contact.gstin",
  "social.instagram",
  "social.facebook",
  "order.numberPrefix",
  "shipping.freeThresholdInr",
  "shipping.flatRateInr",
  "shipping.codFeeInr",
  "shipping.codEnabled",
] as const;

export async function listSettings() {
  await assertAdmin();
  const rows = await prisma.setting.findMany({ where: { key: { in: ALLOWED_KEYS as unknown as string[] } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return (ALLOWED_KEYS as unknown as string[]).map((key) => ({ key, value: map.get(key) ?? "" }));
}

export async function saveSetting(key: string, value: string) {
  await assertAdmin();
  if (!(ALLOWED_KEYS as unknown as string[]).includes(key)) return { ok: false as const, error: "Unknown setting." };
  const existing = await prisma.setting.findUnique({ where: { key } });
  let parsedValue: unknown = value;
  if (/Inr$|Enabled$/.test(key)) {
    const n = Number(value);
    parsedValue = Number.isFinite(n) ? n : (value === "true" ? true : value === "false" ? false : value);
  }
  await prisma.setting.upsert({ where: { key }, update: { value: parsedValue as never }, create: { key, value: parsedValue as never } });
  await recordAudit({ action: "setting.update", entityType: "Setting", entityId: key, before: existing?.value as never, after: parsedValue as never });
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
