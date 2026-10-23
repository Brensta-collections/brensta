/**
 * Integration test: getCategoryByPathWithVisibleChildren marks
 * `hasProductsInSubtree` correctly so the storefront chip row can hide
 * categories that have no stock anywhere beneath them.
 *
 * Creates a throwaway category subtree + one product in afterAll-cleaned
 * namespaces; the live seed is never touched.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { getCategoryByPathWithVisibleChildren } from "@/lib/categories";

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

const stamp = Date.now();
const parentSlug = `qa-chips-${stamp}`;
const parentPath = `/${parentSlug}`;
const emptyChildSlug = "qa-empty";
const stockedChildSlug = "qa-stocked";
const productSlug = `qa-chip-product-${stamp}`;
const variantSku = `QA-CHIPS-${stamp}`;

beforeAll(async () => {
  const parent = await prisma.category.create({
    data: { name: "QA Chips Parent", slug: parentSlug, path: parentPath, depth: 0, status: "PUBLISHED" },
  });
  await prisma.category.create({
    data: {
      name: "QA Empty Child",
      slug: emptyChildSlug,
      path: `${parentPath}/${emptyChildSlug}`,
      depth: 1,
      parentId: parent.id,
      status: "PUBLISHED",
    },
  });
  const stocked = await prisma.category.create({
    data: {
      name: "QA Stocked Child",
      slug: stockedChildSlug,
      path: `${parentPath}/${stockedChildSlug}`,
      depth: 1,
      parentId: parent.id,
      status: "PUBLISHED",
    },
  });
  const product = await prisma.product.create({
    data: {
      slug: productSlug,
      name: "QA chip product",
      basePrice: 1,
      status: "PUBLISHED",
    },
  });
  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: stocked.id, isPrimary: true },
  });
  await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: variantSku,
      price: 1,
      stock: 0,
      optionValues: { Default: "default" },
      isActive: true,
    },
  });
});

afterAll(async () => {
  // Products cascade to variants + productCategory via schema.
  await prisma.product.deleteMany({ where: { slug: productSlug } });
  await prisma.category.deleteMany({ where: { path: { startsWith: parentPath } } });
  await prisma.$disconnect();
});

describe("getCategoryByPathWithVisibleChildren", () => {
  it("marks the empty child as hasProductsInSubtree=false and the stocked child as true", async () => {
    const cat = await getCategoryByPathWithVisibleChildren(parentPath);
    expect(cat).toBeTruthy();
    const emptyChild = cat!.children.find((c) => c.slug === emptyChildSlug);
    const stockedChild = cat!.children.find((c) => c.slug === stockedChildSlug);
    expect(emptyChild).toBeTruthy();
    expect(stockedChild).toBeTruthy();
    expect(emptyChild!.hasProductsInSubtree).toBe(false);
    expect(stockedChild!.hasProductsInSubtree).toBe(true);
  });

  it("returns null for a non-existent path", async () => {
    const cat = await getCategoryByPathWithVisibleChildren(`${parentPath}/does-not-exist`);
    expect(cat).toBeNull();
  });
});
