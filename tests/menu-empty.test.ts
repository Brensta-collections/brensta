/**
 * Confirms that getMainCategoriesWithChildren hides a category that has no
 * published products anywhere in its subtree. Uses a dedicated throwaway category
 * so existing seed data is untouched.
 */
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { getMainCategoriesWithChildren } from "@/lib/categories";

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

const slug = `qa-empty-${Date.now()}`;

afterAll(async () => {
  await prisma.category.deleteMany({ where: { path: `/${slug}` } });
  await prisma.$disconnect();
});

describe("menu: empty-category hiding", () => {
  it("hides a top-level category with no products anywhere in its subtree", async () => {
    await prisma.category.create({
      data: {
        name: "QA Empty",
        slug,
        path: `/${slug}`,
        depth: 0,
        status: "PUBLISHED",
        showInMenu: true,
      },
    });
    const roots = await getMainCategoriesWithChildren();
    const found = roots.find((r) => r.path === `/${slug}`);
    expect(found).toBeUndefined();
  });
});
