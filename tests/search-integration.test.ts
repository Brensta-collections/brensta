/**
 * Integration tests for listProducts search behaviour against the live
 * dev database. Mirrors the env-loading + Prisma pattern used in
 * tests/menu-empty.test.ts so these run under the same `pnpm test`.
 *
 * Only reads. No category or product data is created or modified.
 */
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { listProducts } from "@/lib/products";

// Load .env + .env.local so DATABASE_URL is available when vitest runs.
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
  } catch {
    /* ignore */
  }
}

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("search: audit scenarios", () => {
  it("'jewellery' returns at least one product (parent-category match — the audit's primary failure case)", async () => {
    const r = await listProducts({ search: "jewellery", perPage: 60 });
    expect(r.total).toBeGreaterThan(0);
  });

  it("is case-insensitive", async () => {
    const low = await listProducts({ search: "jewellery", perPage: 60 });
    const up = await listProducts({ search: "Jewellery", perPage: 60 });
    expect(up.total).toBe(low.total);
  });

  it("singular query finds plural-named products via substring", async () => {
    const r = await listProducts({ search: "earring", perPage: 60 });
    expect(r.total).toBeGreaterThan(0);
  });

  it("plural query finds the same (or more) via stem stripping", async () => {
    const sing = await listProducts({ search: "earring", perPage: 60 });
    const plur = await listProducts({ search: "earrings", perPage: 60 });
    expect(plur.total).toBeGreaterThanOrEqual(sing.total);
  });

  it("'jhumka' finds the migrated jhumka products", async () => {
    const r = await listProducts({ search: "jhumka", perPage: 60 });
    expect(r.total).toBeGreaterThanOrEqual(2);
  });

  it("'jhumkas' (plural, now matches no category directly) still finds them via stem stripping", async () => {
    const r = await listProducts({ search: "jhumkas", perPage: 60 });
    expect(r.total).toBeGreaterThanOrEqual(2);
  });

  it("'footwear' finds products via parent-category match even though no product is linked to /footwear directly", async () => {
    const r = await listProducts({ search: "footwear", perPage: 60 });
    expect(r.total).toBeGreaterThan(0);
  });
});

describe("search: ILIKE metacharacters are handled literally", () => {
  it("'%' alone does NOT match every published product", async () => {
    const everything = await prisma.product.count({ where: { status: "PUBLISHED" } });
    const r = await listProducts({ search: "%", perPage: 100 });
    expect(r.total).toBeLessThan(everything);
  });

  it("'_' alone does NOT match every published product", async () => {
    const everything = await prisma.product.count({ where: { status: "PUBLISHED" } });
    const r = await listProducts({ search: "_", perPage: 100 });
    expect(r.total).toBeLessThan(everything);
  });

  it("a lone backslash does not throw and returns a valid result shape", async () => {
    const r = await listProducts({ search: "\\", perPage: 100 });
    expect(r).toHaveProperty("total");
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it("'50%' is treated literally — at most as many hits as the pure '50'", async () => {
    const fifty = await listProducts({ search: "50", perPage: 100 });
    const fiftyPct = await listProducts({ search: "50%", perPage: 100 });
    expect(fiftyPct.total).toBeLessThanOrEqual(fifty.total);
  });
});
