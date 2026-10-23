/**
 * One-shot data migration for the Jewellery category expansion.
 *
 * Scope (owner-approved on 2026-10-23):
 *   1. Add 18 subcategories under Earrings/Necklaces/Rings/Bracelets.
 *   2. Move all products currently on /jewellery/jhumkas to the new
 *      /jewellery/earrings/jhumka. Preserve isPrimary.
 *   3. Delete the retired /jewellery/jhumkas row.
 *
 * Runs with `--dry-run` first by default — no writes. Pass `--apply` to
 * actually write. Everything else goes through a single transaction so a
 * failure anywhere aborts the whole thing.
 *
 * Pre-image for rollback is printed to stdout BEFORE any write. Capture it:
 *   pnpm tsx prisma/migrate-jewellery.ts --dry-run > rollback.json
 */
import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

type NewCat = { parentPath: string; slug: string; name: string; sortOrder: number };

const NEW_CATEGORIES: NewCat[] = [
  // Earrings → 7 varieties
  { parentPath: "/jewellery/earrings", slug: "studs",      name: "Studs",            sortOrder: 0 },
  { parentPath: "/jewellery/earrings", slug: "hoops",      name: "Hoops",            sortOrder: 1 },
  { parentPath: "/jewellery/earrings", slug: "jhumka",     name: "Jhumka",           sortOrder: 2 },
  { parentPath: "/jewellery/earrings", slug: "drops",      name: "Drops & Dangles",  sortOrder: 3 },
  { parentPath: "/jewellery/earrings", slug: "chandbali",  name: "Chandbali",        sortOrder: 4 },
  { parentPath: "/jewellery/earrings", slug: "huggies",    name: "Huggies",          sortOrder: 5 },
  { parentPath: "/jewellery/earrings", slug: "ear-cuffs",  name: "Ear Cuffs",        sortOrder: 6 },
  // Necklaces → 4 varieties
  { parentPath: "/jewellery/necklaces", slug: "chokers",   name: "Chokers",          sortOrder: 0 },
  { parentPath: "/jewellery/necklaces", slug: "chains",    name: "Chains",           sortOrder: 1 },
  { parentPath: "/jewellery/necklaces", slug: "statement", name: "Statement",        sortOrder: 2 },
  { parentPath: "/jewellery/necklaces", slug: "layered",   name: "Layered",          sortOrder: 3 },
  // Rings → 4 varieties
  { parentPath: "/jewellery/rings", slug: "stackable",     name: "Stackable",        sortOrder: 0 },
  { parentPath: "/jewellery/rings", slug: "statement",     name: "Statement",        sortOrder: 1 },
  { parentPath: "/jewellery/rings", slug: "adjustable",    name: "Adjustable",       sortOrder: 2 },
  { parentPath: "/jewellery/rings", slug: "finger-tip",    name: "Finger-tip",       sortOrder: 3 },
  // Bracelets → 3 varieties
  { parentPath: "/jewellery/bracelets", slug: "cuffs",     name: "Cuffs",            sortOrder: 0 },
  { parentPath: "/jewellery/bracelets", slug: "chain",     name: "Chain Bracelets",  sortOrder: 1 },
  { parentPath: "/jewellery/bracelets", slug: "charm",     name: "Charm Bracelets",  sortOrder: 2 },
];

const OLD_JHUMKAS_PATH = "/jewellery/jhumkas";
const NEW_JHUMKA_PATH = "/jewellery/earrings/jhumka";

async function dumpPreImage() {
  const parentsNeeded = Array.from(new Set(NEW_CATEGORIES.map((c) => c.parentPath)));
  const parents = await prisma.category.findMany({
    where: { path: { in: parentsNeeded } },
    select: { id: true, path: true, depth: true, status: true },
  });

  const paths = NEW_CATEGORIES.map((c) => `${c.parentPath}/${c.slug}`);
  const existingNewCats = await prisma.category.findMany({
    where: { path: { in: paths } },
    select: { id: true, path: true, name: true, status: true, parentId: true },
  });

  const oldJhumkas = await prisma.category.findUnique({
    where: { path: OLD_JHUMKAS_PATH },
    include: {
      _count: { select: { products: true, children: true } },
    },
  });

  const productsOnOld = oldJhumkas
    ? await prisma.productCategory.findMany({
        where: { categoryId: oldJhumkas.id },
        include: {
          product: {
            select: { id: true, slug: true, name: true, status: true },
          },
        },
        orderBy: { productId: "asc" },
      })
    : [];

  return { parents, existingNewCats, oldJhumkas, productsOnOld };
}

async function main(mode: "dry-run" | "apply") {
  const pre = await dumpPreImage();

  console.log("=".repeat(70));
  console.log(`MIGRATION — mode: ${mode}`);
  console.log(`timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(70));

  console.log("\n── Parents (must all exist, status PUBLISHED) ──");
  for (const p of pre.parents) {
    console.log(`  ${p.path.padEnd(28)} depth=${p.depth} status=${p.status} id=${p.id}`);
  }
  const parentPaths = new Set(pre.parents.map((p) => p.path));
  const missingParents = Array.from(new Set(NEW_CATEGORIES.map((c) => c.parentPath))).filter(
    (p) => !parentPaths.has(p),
  );
  if (missingParents.length) {
    console.log("\n✗ Missing parent paths — aborting:");
    for (const m of missingParents) console.log(`    ${m}`);
    throw new Error("Missing parent categories; cannot proceed.");
  }

  console.log("\n── Step 1: new categories to upsert ──");
  const existingByPath = new Map(pre.existingNewCats.map((c) => [c.path, c]));
  let toCreate = 0;
  let toUpdate = 0;
  for (const c of NEW_CATEGORIES) {
    const path = `${c.parentPath}/${c.slug}`;
    const already = existingByPath.get(path);
    const tag = already ? "update" : "create";
    if (already) toUpdate++;
    else toCreate++;
    console.log(`  [${tag}] ${path.padEnd(42)} name="${c.name}" sortOrder=${c.sortOrder}` + (already ? ` existing-id=${already.id}` : ""));
  }
  console.log(`  → ${toCreate} new, ${toUpdate} already present (will be upserted).`);

  console.log("\n── Step 2: Jhumkas → Earrings/Jhumka product reassignment ──");
  if (!pre.oldJhumkas) {
    console.log(`  Old category ${OLD_JHUMKAS_PATH} not found — Step 2 is a no-op.`);
  } else {
    console.log(`  Old row: id=${pre.oldJhumkas.id} status=${pre.oldJhumkas.status} children=${pre.oldJhumkas._count.children} products=${pre.oldJhumkas._count.products}`);
    if (pre.oldJhumkas._count.children > 0) {
      console.log("\n  ✗ Old Jhumkas has subcategories. Step 3 (delete) would fail.");
      console.log("     Resolve child categories first (admin), then rerun.");
    }
    if (pre.productsOnOld.length === 0) {
      console.log("  No products currently on the old row — reassignment is a no-op.");
    } else {
      for (const pc of pre.productsOnOld) {
        console.log(`  [move] product="${pc.product.slug}" name="${pc.product.name}" status=${pc.product.status} isPrimary=${pc.isPrimary}`);
      }
      console.log(`  → ${pre.productsOnOld.length} ProductCategory rows will be moved to ${NEW_JHUMKA_PATH}.`);
    }
  }

  console.log("\n── Step 3: delete old /jewellery/jhumkas row ──");
  if (!pre.oldJhumkas) {
    console.log("  Already absent — nothing to delete.");
  } else {
    console.log(`  Will delete Category id=${pre.oldJhumkas.id} after Step 2 completes.`);
  }

  // Pre-image JSON for rollback — printed last so it's the final structured
  // output. The user can grep/jq it; everything above is a human summary.
  console.log("\n── Pre-image JSON (save this for rollback) ──");
  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        oldJhumkas: pre.oldJhumkas
          ? {
              id: pre.oldJhumkas.id,
              name: pre.oldJhumkas.name,
              slug: pre.oldJhumkas.slug,
              path: pre.oldJhumkas.path,
              parentId: pre.oldJhumkas.parentId,
              depth: pre.oldJhumkas.depth,
              status: pre.oldJhumkas.status,
              sortOrder: pre.oldJhumkas.sortOrder,
              showInMenu: pre.oldJhumkas.showInMenu,
              createdAt: pre.oldJhumkas.createdAt.toISOString(),
            }
          : null,
        productsOnOld: pre.productsOnOld.map((pc) => ({
          productId: pc.productId,
          categoryId: pc.categoryId,
          isPrimary: pc.isPrimary,
          slug: pc.product.slug,
        })),
        existingNewCats: pre.existingNewCats.map((c) => ({
          id: c.id,
          path: c.path,
          name: c.name,
          status: c.status,
        })),
      },
      null,
      2,
    ),
  );

  if (mode === "dry-run") {
    console.log("\n=== DRY RUN — no writes performed. Re-run with --apply to execute. ===");
    return;
  }

  // ── APPLY MODE ─────────────────────────────────────────────────────────
  console.log("\n=== APPLYING in a single transaction ===");
  await prisma.$transaction(async (tx) => {
    // Step 1: upsert new categories (idempotent on path).
    const parentIdByPath = new Map(pre.parents.map((p) => [p.path, { id: p.id, depth: p.depth }]));
    for (const row of NEW_CATEGORIES) {
      const parent = parentIdByPath.get(row.parentPath)!;
      const path = `${row.parentPath}/${row.slug}`;
      await tx.category.upsert({
        where: { path },
        update: {
          name: row.name,
          sortOrder: row.sortOrder,
          status: PublishStatus.PUBLISHED,
          showInMenu: true,
        },
        create: {
          name: row.name,
          slug: row.slug,
          parentId: parent.id,
          path,
          depth: parent.depth + 1,
          status: PublishStatus.PUBLISHED,
          showInMenu: true,
          sortOrder: row.sortOrder,
        },
      });
    }

    // Step 2 + 3: reassign + delete only if the old row exists.
    if (pre.oldJhumkas) {
      const newJhumka = await tx.category.findUnique({
        where: { path: NEW_JHUMKA_PATH },
        select: { id: true },
      });
      if (!newJhumka) throw new Error("New Jhumka category not found after Step 1");

      for (const pc of pre.productsOnOld) {
        // Remove the old link first (unique on productId+categoryId).
        await tx.productCategory.delete({
          where: { productId_categoryId: { productId: pc.productId, categoryId: pre.oldJhumkas.id } },
        });
        // Idempotent re-insert — skip if the product is already linked to new.
        const already = await tx.productCategory.findUnique({
          where: { productId_categoryId: { productId: pc.productId, categoryId: newJhumka.id } },
        });
        if (!already) {
          await tx.productCategory.create({
            data: {
              productId: pc.productId,
              categoryId: newJhumka.id,
              isPrimary: pc.isPrimary,
            },
          });
        }
      }

      await tx.category.delete({ where: { id: pre.oldJhumkas.id } });
    }
  });
  console.log("Transaction committed.");
}

const mode = process.argv.includes("--apply") ? "apply" : "dry-run";
main(mode)
  .catch((e) => {
    console.error("\n✗ MIGRATION FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
