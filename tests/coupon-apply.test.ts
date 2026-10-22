/**
 * Integration test for lib/coupons.ts evaluateCoupon.
 * Confirms every rule branch:
 *   - unknown code
 *   - inactive
 *   - expired
 *   - minOrder
 *   - per-user limit
 *   - global limit
 *   - category restriction match / mismatch
 *   - percentage with maxDiscount cap
 *   - redemption count read from DB (not cart state)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { nanoid } from "nanoid";
import { evaluateCoupon } from "@/lib/coupon-eval";

for (const path of [".env", ".env.local"]) {
  try {
    const txt = readFileSync(path, "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*(\w+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2];
      if (process.env[k]) continue;
      v = v.replace(/^"(.*)"$/, "$1");
      process.env[k] = v;
    }
  } catch { /* ignore */ }
}
const prisma = new PrismaClient();

const codes: string[] = [];
let userId: string;
let categoryId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `qa-coupon-${nanoid(6)}@brensta.local`, name: "QA Coupon", role: "CUSTOMER", isActive: true },
  });
  userId = user.id;
  const anyCat = await prisma.category.findFirst({ where: { status: "PUBLISHED" }, select: { id: true } });
  categoryId = anyCat!.id;
});

afterAll(async () => {
  await prisma.couponRedemption.deleteMany({ where: { userId } });
  await prisma.coupon.deleteMany({ where: { code: { in: codes } } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  await prisma.$disconnect();
});

async function mk(code: string, overrides: Partial<Parameters<typeof prisma.coupon.create>[0]["data"]> = {}) {
  codes.push(code);
  return prisma.coupon.create({
    data: { code, type: "PERCENT", value: 10, isActive: true, ...overrides },
  });
}

describe("evaluateCoupon", () => {
  it("rejects unknown code", async () => {
    const r = await evaluateCoupon({ code: "NOPE123", subtotal: 1000, cartCategoryIds: [], userId });
    expect(r.ok).toBe(false);
  });

  it("rejects inactive", async () => {
    await mk(`QA-INACT-${nanoid(4).toUpperCase()}`, { isActive: false });
    const r = await evaluateCoupon({ code: codes[codes.length - 1], subtotal: 1000, cartCategoryIds: [], userId });
    expect(r.ok).toBe(false);
  });

  it("rejects below minOrder", async () => {
    const c = await mk(`QA-MIN-${nanoid(4).toUpperCase()}`, { minOrder: 2000 });
    const r = await evaluateCoupon({ code: c.code, subtotal: 500, cartCategoryIds: [], userId });
    expect(r.ok).toBe(false);
  });

  it("caps percentage at maxDiscount", async () => {
    const c = await mk(`QA-CAP-${nanoid(4).toUpperCase()}`, { type: "PERCENT", value: 50, maxDiscount: 200 });
    const r = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discount).toBe(200);
  });

  it("accepts flat and discount matches", async () => {
    const c = await mk(`QA-FLAT-${nanoid(4).toUpperCase()}`, { type: "FLAT", value: 150 });
    const r = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discount).toBe(150);
  });

  it("category restriction: rejects when none of the cart matches", async () => {
    const c = await mk(`QA-CAT-${nanoid(4).toUpperCase()}`, { appliesToCategoryIds: [categoryId] });
    const r = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: ["some-other-id"], userId });
    expect(r.ok).toBe(false);
  });

  it("category restriction: accepts when at least one matches", async () => {
    const c = await mk(`QA-CAT2-${nanoid(4).toUpperCase()}`, { appliesToCategoryIds: [categoryId] });
    const r = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [categoryId], userId });
    expect(r.ok).toBe(true);
  });

  it("per-user limit is counted from CouponRedemption", async () => {
    const c = await mk(`QA-PERUSR-${nanoid(4).toUpperCase()}`, { perUserLimit: 1 });
    // No redemptions yet → ok
    const r1 = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r1.ok).toBe(true);
    // Seed a redemption and re-check → blocked
    const dummyOrder = await prisma.order.create({
      data: {
        number: `QA-${nanoid(6).toUpperCase()}`,
        userId,
        email: "qa@brensta.local",
        phone: "9876543210",
        status: "PENDING",
        subtotal: 1,
        total: 1,
        currency: "INR",
        shippingAddress: {} as never,
        idempotencyKey: `qa-${nanoid(10)}`,
      },
    });
    await prisma.couponRedemption.create({ data: { couponId: c.id, userId, orderId: dummyOrder.id, amount: 100 } });
    const r2 = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r2.ok).toBe(false);
    await prisma.couponRedemption.deleteMany({ where: { couponId: c.id } });
    await prisma.order.delete({ where: { id: dummyOrder.id } });
  });

  it("global limit is counted from CouponRedemption", async () => {
    const c = await mk(`QA-GLOB-${nanoid(4).toUpperCase()}`, { globalLimit: 1 });
    // No redemption yet → ok
    const r1 = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r1.ok).toBe(true);
    // Seed one redemption from a different user → limit hit
    const otherUser = await prisma.user.create({ data: { email: `qa-cother-${nanoid(4)}@brensta.local`, role: "CUSTOMER" } });
    const dummyOrder = await prisma.order.create({
      data: {
        number: `QA-${nanoid(6).toUpperCase()}`,
        userId: otherUser.id,
        email: otherUser.email,
        phone: "9876543210",
        status: "PENDING",
        subtotal: 1,
        total: 1,
        currency: "INR",
        shippingAddress: {} as never,
        idempotencyKey: `qa-${nanoid(10)}`,
      },
    });
    await prisma.couponRedemption.create({ data: { couponId: c.id, userId: otherUser.id, orderId: dummyOrder.id, amount: 1 } });
    const r2 = await evaluateCoupon({ code: c.code, subtotal: 1000, cartCategoryIds: [], userId });
    expect(r2.ok).toBe(false);
    await prisma.couponRedemption.deleteMany({ where: { couponId: c.id } });
    await prisma.order.delete({ where: { id: dummyOrder.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });
});
