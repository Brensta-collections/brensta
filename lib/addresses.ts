"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-helpers";
import { addressSchema, type AddressInput } from "@/lib/validators/address";

export async function listAddresses() {
  const userId = await getSessionUserId();
  if (!userId) return [];
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getAddress(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const addr = await prisma.address.findUnique({ where: { id } });
  if (!addr || addr.userId !== userId) return null;
  return addr;
}

export async function createAddress(input: AddressInput) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Please sign in." };
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    } else {
      // make the first address the default automatically
      const count = await tx.address.count({ where: { userId } });
      if (count === 0) parsed.data.isDefault = true;
    }
    await tx.address.create({
      data: {
        userId,
        label: parsed.data.label || null,
        name: parsed.data.name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        country: "IN",
        isDefault: !!parsed.data.isDefault,
      },
    });
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true as const };
}

export async function updateAddress(id: string, input: AddressInput) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Please sign in." };
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return { ok: false as const, error: "Address not found." };

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
    }
    await tx.address.update({
      where: { id },
      data: {
        label: parsed.data.label || null,
        name: parsed.data.name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        isDefault: parsed.data.isDefault ?? existing.isDefault,
      },
    });
  });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true as const };
}

export async function deleteAddress(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return;
  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const userId = await getSessionUserId();
  if (!userId) return;
  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}
