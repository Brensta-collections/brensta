/**
 * Post-apply verification of the Jewellery migration. Read-only.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const expectedPaths = [
    "/jewellery/earrings/studs",
    "/jewellery/earrings/hoops",
    "/jewellery/earrings/jhumka",
    "/jewellery/earrings/drops",
    "/jewellery/earrings/chandbali",
    "/jewellery/earrings/huggies",
    "/jewellery/earrings/ear-cuffs",
    "/jewellery/necklaces/chokers",
    "/jewellery/necklaces/chains",
    "/jewellery/necklaces/statement",
    "/jewellery/necklaces/layered",
    "/jewellery/rings/stackable",
    "/jewellery/rings/statement",
    "/jewellery/rings/adjustable",
    "/jewellery/rings/finger-tip",
    "/jewellery/bracelets/cuffs",
    "/jewellery/bracelets/chain",
    "/jewellery/bracelets/charm",
  ];
  const found = await prisma.category.findMany({
    where: { path: { in: expectedPaths } },
    select: { path: true, name: true, status: true, showInMenu: true, depth: true, sortOrder: true },
    orderBy: { path: "asc" },
  });

  console.log(`── New categories created: ${found.length} / ${expectedPaths.length} ──`);
  for (const c of found) {
    console.log(`  ${c.path.padEnd(42)} depth=${c.depth} status=${c.status} inMenu=${c.showInMenu} sort=${c.sortOrder}`);
  }
  const missing = expectedPaths.filter((p) => !found.some((f) => f.path === p));
  if (missing.length) {
    console.log(`\n✗ MISSING ${missing.length}:`);
    for (const m of missing) console.log(`    ${m}`);
  }

  const oldJhumkas = await prisma.category.findUnique({ where: { path: "/jewellery/jhumkas" } });
  console.log(`\n── Old /jewellery/jhumkas row: ${oldJhumkas ? "STILL PRESENT" : "DELETED ✓"} ──`);

  const newJhumka = await prisma.category.findUnique({
    where: { path: "/jewellery/earrings/jhumka" },
    include: { _count: { select: { products: true } } },
  });
  console.log(`── /jewellery/earrings/jhumka products: ${newJhumka?._count.products ?? "n/a"} ──`);

  if (newJhumka) {
    const rows = await prisma.productCategory.findMany({
      where: { categoryId: newJhumka.id },
      include: { product: { select: { slug: true, name: true, status: true } } },
    });
    for (const r of rows) {
      console.log(`    product="${r.product.slug}" name="${r.product.name}" status=${r.product.status} isPrimary=${r.isPrimary}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
