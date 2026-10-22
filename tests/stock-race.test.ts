/**
 * Integration test: concurrent stock decrement must not oversell.
 * Uses the real DB (brensta_dev). Creates a dedicated DEMO variant,
 * fires N concurrent decrements, verifies that count never goes below zero
 * and that exactly `stock` succeeded.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

// Load DATABASE_URL from .env or .env.local
for (const path of [".env", ".env.local"]) {
  try {
    const txt = readFileSync(path, "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*(\w+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let [, k, v] = m;
      if (process.env[k]) continue;
      v = v.replace(/^"(.*)"$/, "$1");
      process.env[k] = v;
    }
  } catch { /* ignore */ }
}

const prisma = new PrismaClient();

let productId: string;
let variantId: string;

beforeAll(async () => {
  const product = await prisma.product.create({
    data: {
      slug: `stocktest-${Date.now()}`,
      name: "DEMO stock race product",
      basePrice: 100,
      status: "DRAFT",
    },
  });
  productId = product.id;
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: `DEMO-STOCKTEST-${Date.now()}`,
      price: 100,
      stock: 5,
      optionValues: { Size: "M" },
      isActive: true,
    },
  });
  variantId = variant.id;
});

afterAll(async () => {
  await prisma.productVariant.delete({ where: { id: variantId } }).catch(() => null);
  await prisma.product.delete({ where: { id: productId } }).catch(() => null);
  await prisma.$disconnect();
});

describe("variant stock decrement under concurrency", () => {
  it("never oversells: 10 concurrent 1-unit decrements against stock=5 only 5 succeed", async () => {
    const attempts = Array.from({ length: 10 }, () =>
      prisma.productVariant
        .updateMany({ where: { id: variantId, stock: { gte: 1 } }, data: { stock: { decrement: 1 } } })
        .then((r) => r.count)
    );
    const results = await Promise.all(attempts);
    const succeeded = results.reduce((a, b) => a + b, 0);
    const final = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stock: true } });
    expect(final?.stock).toBe(0);
    expect(succeeded).toBe(5);
  });
});
