/**
 * Integration test for lib/wishlist-merge.ts.
 * Uses the real brensta_dev DB; creates throwaway users / wishlist rows and cleans up.
 * The cookie layer is not exercised here; we call the merge function directly after seeding
 * guest rows under a known token.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { nanoid } from "nanoid";

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

const guestToken = `qa_${nanoid(10)}`;
let userId: string;
let productA: string;
let productB: string;
let archivedProductId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `qa-wishlist-${nanoid(6)}@brensta.local`, name: "QA Wishlist", role: "CUSTOMER", isActive: true },
  });
  userId = user.id;

  const [a, b, c] = await Promise.all([
    prisma.product.create({ data: { slug: `qa-wish-a-${nanoid(6)}`, name: "QA Wish A", basePrice: 100, status: "PUBLISHED" } }),
    prisma.product.create({ data: { slug: `qa-wish-b-${nanoid(6)}`, name: "QA Wish B", basePrice: 100, status: "PUBLISHED" } }),
    prisma.product.create({ data: { slug: `qa-wish-c-${nanoid(6)}`, name: "QA Wish C", basePrice: 100, status: "ARCHIVED" } }),
  ]);
  productA = a.id;
  productB = b.id;
  archivedProductId = c.id;
});

afterAll(async () => {
  await prisma.wishlist.deleteMany({ where: { OR: [{ userId }, { guestToken }] } });
  await prisma.product.deleteMany({ where: { id: { in: [productA, productB, archivedProductId] } } });
  await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  await prisma.$disconnect();
});

describe("mergeGuestWishlistIntoUser", () => {
  it("moves guest rows into the user, deduplicates and drops invalid products", async () => {
    // Seed: user already saved A. Guest has A (dupe), B (new), archived C (should be dropped).
    await prisma.wishlist.create({ data: { userId, productId: productA } });
    await prisma.wishlist.createMany({
      data: [
        { guestToken, productId: productA },
        { guestToken, productId: productB },
        { guestToken, productId: archivedProductId },
      ],
    });

    // Use the test-friendly entry point that takes the token explicitly (no cookie dependency).
    const { mergeGuestWishlistRows } = await import("@/lib/wishlist-merge");
    await mergeGuestWishlistRows(userId, guestToken);

    const userRows = await prisma.wishlist.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    const userProductIds = userRows.map((r) => r.productId).sort();
    expect(userProductIds).toEqual([productA, productB].sort());

    const guestRows = await prisma.wishlist.findMany({ where: { guestToken } });
    expect(guestRows).toHaveLength(0);
  });

  it("creates the (guestToken, productId) unique constraint — second insert collides", async () => {
    const token = `qa_dup_${nanoid(6)}`;
    await prisma.wishlist.create({ data: { guestToken: token, productId: productB } });
    await expect(
      prisma.wishlist.create({ data: { guestToken: token, productId: productB } })
    ).rejects.toThrow();
    await prisma.wishlist.deleteMany({ where: { guestToken: token } });
  });

  it("userId + productId uniqueness still enforced for logged-in users", async () => {
    await expect(
      prisma.wishlist.create({ data: { userId, productId: productA } })
    ).rejects.toThrow();
  });
});
