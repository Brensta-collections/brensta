"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-helpers";
import { changePasswordSchema } from "@/lib/validators/auth";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/i, "Enter a 10-digit Indian mobile number.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function updateProfile(data: { name: string; phone?: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Please sign in." };
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name, phone: parsed.data.phone ?? null } });
  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true as const };
}

export async function changePassword(input: { current: string; next: string }) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Please sign in." };
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return { ok: false as const, error: "Password change is not available for your account." };
  const ok = await bcrypt.compare(parsed.data.current, user.passwordHash);
  if (!ok) return { ok: false as const, error: "Current password is incorrect." };
  const hash = await bcrypt.hash(parsed.data.next, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  return { ok: true as const };
}
