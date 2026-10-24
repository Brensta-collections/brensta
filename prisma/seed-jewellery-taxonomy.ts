/**
 * Phase A — Jewellery taxonomy expansion.
 *
 * Additive-only: creates NEW rows under `/jewellery` without touching any
 * existing category row. Idempotent on re-run (skips a row if its path
 * already exists). Dry-run by default; pass `--apply` to execute inside a
 * single transaction.
 *
 * Rollback: capture the printed "created paths" list; roll back via
 *   DELETE FROM "Category" WHERE path IN (<the list>) AND NOT EXISTS (
 *     SELECT 1 FROM "ProductCategory" WHERE "categoryId" = "Category".id
 *   );
 *
 * Decisions applied (owner-approved, 2026-10-24):
 *   - 6 new top-level categories under /jewellery; owner explicitly selected
 *     these for the main menu, so showInMenu=true on these.
 *   - 83 new depth-2 subcategories across 16 top-level jewellery parents;
 *     showInMenu=false by default — owner promotes individual ones from
 *     /admin/categories as inventory grows.
 *   - All new rows status=PUBLISHED (the chip row + mega menu will still
 *     hide them until they have products in their subtree, so this is safe).
 */
import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

type NewTopLevel = { slug: string; name: string; sortOrder: number };
type NewDepth2 = { parentPath: string; slug: string; name: string; sortOrder: number };

const NEW_TOP_LEVEL: NewTopLevel[] = [
  { slug: "nose-jewellery",   name: "Nose Jewellery",    sortOrder: 20 },
  { slug: "hair-jewellery",   name: "Hair Jewellery",    sortOrder: 21 },
  { slug: "waist-jewellery",  name: "Waist Jewellery",   sortOrder: 22 },
  { slug: "brooches-pins",    name: "Brooches & Pins",   sortOrder: 23 },
  { slug: "mens-jewellery",   name: "Men's Jewellery",   sortOrder: 24 },
  { slug: "kids-jewellery",   name: "Kids' Jewellery",   sortOrder: 25 },
];

const NEW_DEPTH_2: NewDepth2[] = [
  // ── Earrings (append after existing 0..6) ──
  { parentPath: "/jewellery/earrings", slug: "ear-climbers", name: "Ear Climbers", sortOrder: 7 },
  { parentPath: "/jewellery/earrings", slug: "ear-jackets", name: "Ear Jackets", sortOrder: 8 },
  { parentPath: "/jewellery/earrings", slug: "threaders", name: "Threaders", sortOrder: 9 },
  { parentPath: "/jewellery/earrings", slug: "mismatched", name: "Mismatched Earrings", sortOrder: 10 },
  { parentPath: "/jewellery/earrings", slug: "clip-ons", name: "Clip-ons", sortOrder: 11 },

  // ── Necklaces (append after existing 0..3) ──
  { parentPath: "/jewellery/necklaces", slug: "rani-haar", name: "Rani Haar", sortOrder: 4 },
  { parentPath: "/jewellery/necklaces", slug: "chandra-haar", name: "Chandra Haar", sortOrder: 5 },
  { parentPath: "/jewellery/necklaces", slug: "beaded", name: "Beaded", sortOrder: 6 },
  { parentPath: "/jewellery/necklaces", slug: "pearl-strands", name: "Pearl Strands", sortOrder: 7 },
  { parentPath: "/jewellery/necklaces", slug: "collar", name: "Collar Necklaces", sortOrder: 8 },

  // ── Rings (append after existing 0..3) ──
  { parentPath: "/jewellery/rings", slug: "cocktail", name: "Cocktail", sortOrder: 4 },
  { parentPath: "/jewellery/rings", slug: "promise", name: "Promise / Band", sortOrder: 5 },
  { parentPath: "/jewellery/rings", slug: "signet", name: "Signet", sortOrder: 6 },
  { parentPath: "/jewellery/rings", slug: "toe-rings", name: "Toe Rings (Bichhiya)", sortOrder: 7 },
  { parentPath: "/jewellery/rings", slug: "thumb", name: "Thumb Rings", sortOrder: 8 },
  { parentPath: "/jewellery/rings", slug: "nameplate", name: "Nameplate", sortOrder: 9 },

  // ── Bracelets (append after existing 0..2) ──
  { parentPath: "/jewellery/bracelets", slug: "beaded", name: "Beaded", sortOrder: 3 },
  { parentPath: "/jewellery/bracelets", slug: "tennis", name: "Tennis", sortOrder: 4 },
  { parentPath: "/jewellery/bracelets", slug: "link", name: "Link", sortOrder: 5 },
  { parentPath: "/jewellery/bracelets", slug: "stretch", name: "Stretch", sortOrder: 6 },
  { parentPath: "/jewellery/bracelets", slug: "bracelet-sets", name: "Bracelet Sets", sortOrder: 7 },

  // ── Bangles (new tree under existing) ──
  { parentPath: "/jewellery/bangles", slug: "classic", name: "Classic Bangles", sortOrder: 0 },
  { parentPath: "/jewellery/bangles", slug: "kada", name: "Kada", sortOrder: 1 },
  { parentPath: "/jewellery/bangles", slug: "chooda", name: "Chooda / Bridal", sortOrder: 2 },
  { parentPath: "/jewellery/bangles", slug: "openable", name: "Openable / Hinged", sortOrder: 3 },
  { parentPath: "/jewellery/bangles", slug: "thin", name: "Thin Bangles", sortOrder: 4 },
  { parentPath: "/jewellery/bangles", slug: "thick", name: "Thick / Statement Bangles", sortOrder: 5 },
  { parentPath: "/jewellery/bangles", slug: "bangle-sets", name: "Bangle Sets", sortOrder: 6 },

  // ── Anklets ──
  { parentPath: "/jewellery/anklets", slug: "chain", name: "Chain Anklets", sortOrder: 0 },
  { parentPath: "/jewellery/anklets", slug: "beaded", name: "Beaded Anklets", sortOrder: 1 },
  { parentPath: "/jewellery/anklets", slug: "charm", name: "Charm Anklets", sortOrder: 2 },
  { parentPath: "/jewellery/anklets", slug: "payal", name: "Payal (Traditional)", sortOrder: 3 },
  { parentPath: "/jewellery/anklets", slug: "double-chain", name: "Double-chain Anklets", sortOrder: 4 },
  { parentPath: "/jewellery/anklets", slug: "toe-ring", name: "Toe-ring Anklets", sortOrder: 5 },

  // ── Pendants ──
  { parentPath: "/jewellery/pendants", slug: "religious", name: "Religious", sortOrder: 0 },
  { parentPath: "/jewellery/pendants", slug: "letter", name: "Letter / Alphabet", sortOrder: 1 },
  { parentPath: "/jewellery/pendants", slug: "zodiac", name: "Zodiac", sortOrder: 2 },
  { parentPath: "/jewellery/pendants", slug: "heart", name: "Heart", sortOrder: 3 },
  { parentPath: "/jewellery/pendants", slug: "nature", name: "Nature-inspired", sortOrder: 4 },
  { parentPath: "/jewellery/pendants", slug: "charm", name: "Charm Pendants", sortOrder: 5 },
  { parentPath: "/jewellery/pendants", slug: "lockets", name: "Lockets", sortOrder: 6 },
  { parentPath: "/jewellery/pendants", slug: "statement", name: "Statement Pendants", sortOrder: 7 },

  // ── Mangalsutras ──
  { parentPath: "/jewellery/mangalsutras", slug: "traditional", name: "Traditional", sortOrder: 0 },
  { parentPath: "/jewellery/mangalsutras", slug: "modern", name: "Modern", sortOrder: 1 },
  { parentPath: "/jewellery/mangalsutras", slug: "short", name: "Short", sortOrder: 2 },
  { parentPath: "/jewellery/mangalsutras", slug: "long", name: "Long", sortOrder: 3 },
  { parentPath: "/jewellery/mangalsutras", slug: "pendant", name: "Pendant Mangalsutras", sortOrder: 4 },

  // ── Maang Tikka ──
  { parentPath: "/jewellery/maang-tikka", slug: "classic", name: "Classic Maang Tikka", sortOrder: 0 },
  { parentPath: "/jewellery/maang-tikka", slug: "matha-patti", name: "Matha Patti", sortOrder: 1 },
  { parentPath: "/jewellery/maang-tikka", slug: "borla", name: "Borla (Rajasthani)", sortOrder: 2 },
  { parentPath: "/jewellery/maang-tikka", slug: "chandrika", name: "Chandrika", sortOrder: 3 },

  // ── Jewellery Sets ──
  { parentPath: "/jewellery/jewellery-sets", slug: "bridal", name: "Bridal Sets", sortOrder: 0 },
  { parentPath: "/jewellery/jewellery-sets", slug: "festive", name: "Festive Sets", sortOrder: 1 },
  { parentPath: "/jewellery/jewellery-sets", slug: "earring-necklace", name: "Earring-Necklace Sets", sortOrder: 2 },
  { parentPath: "/jewellery/jewellery-sets", slug: "earring-mangalsutra", name: "Earring-Mangalsutra Sets", sortOrder: 3 },
  { parentPath: "/jewellery/jewellery-sets", slug: "earring-pendant", name: "Earring-Pendant Sets", sortOrder: 4 },
  { parentPath: "/jewellery/jewellery-sets", slug: "daily-wear", name: "Daily-wear Sets", sortOrder: 5 },

  // ── Nose Jewellery (under new top-level) ──
  { parentPath: "/jewellery/nose-jewellery", slug: "nose-pins", name: "Nose Pins", sortOrder: 0 },
  { parentPath: "/jewellery/nose-jewellery", slug: "nose-rings", name: "Nose Rings", sortOrder: 1 },
  { parentPath: "/jewellery/nose-jewellery", slug: "nath", name: "Nath / Nathni", sortOrder: 2 },
  { parentPath: "/jewellery/nose-jewellery", slug: "clip-ons", name: "Clip-ons (non-pierced)", sortOrder: 3 },
  { parentPath: "/jewellery/nose-jewellery", slug: "septum", name: "Septum", sortOrder: 4 },

  // ── Hair Jewellery ──
  { parentPath: "/jewellery/hair-jewellery", slug: "juda-pins", name: "Juda Pins", sortOrder: 0 },
  { parentPath: "/jewellery/hair-jewellery", slug: "hair-chains", name: "Hair Chains", sortOrder: 1 },
  { parentPath: "/jewellery/hair-jewellery", slug: "choti", name: "Choti / Jadanagam", sortOrder: 2 },
  { parentPath: "/jewellery/hair-jewellery", slug: "side-pins", name: "Side Pins", sortOrder: 3 },
  { parentPath: "/jewellery/hair-jewellery", slug: "veni", name: "Floral Veni", sortOrder: 4 },

  // ── Waist Jewellery ──
  { parentPath: "/jewellery/waist-jewellery", slug: "kamarbandh", name: "Kamarbandh", sortOrder: 0 },
  { parentPath: "/jewellery/waist-jewellery", slug: "waist-chains", name: "Waist Chains", sortOrder: 1 },

  // ── Brooches & Pins ──
  { parentPath: "/jewellery/brooches-pins", slug: "classic", name: "Classic Brooches", sortOrder: 0 },
  { parentPath: "/jewellery/brooches-pins", slug: "saree-pins", name: "Saree Pins", sortOrder: 1 },
  { parentPath: "/jewellery/brooches-pins", slug: "dupatta-pins", name: "Dupatta Pins", sortOrder: 2 },
  { parentPath: "/jewellery/brooches-pins", slug: "lapel-pins", name: "Lapel Pins", sortOrder: 3 },

  // ── Men's Jewellery ──
  { parentPath: "/jewellery/mens-jewellery", slug: "rings", name: "Men's Rings", sortOrder: 0 },
  { parentPath: "/jewellery/mens-jewellery", slug: "chains", name: "Men's Chains", sortOrder: 1 },
  { parentPath: "/jewellery/mens-jewellery", slug: "bracelets", name: "Men's Bracelets", sortOrder: 2 },
  { parentPath: "/jewellery/mens-jewellery", slug: "kada", name: "Men's Kada", sortOrder: 3 },
  { parentPath: "/jewellery/mens-jewellery", slug: "pendants", name: "Men's Pendants", sortOrder: 4 },
  { parentPath: "/jewellery/mens-jewellery", slug: "cufflinks", name: "Cufflinks", sortOrder: 5 },

  // ── Kids' Jewellery ──
  { parentPath: "/jewellery/kids-jewellery", slug: "earrings", name: "Kids' Earrings", sortOrder: 0 },
  { parentPath: "/jewellery/kids-jewellery", slug: "bangles", name: "Kids' Bangles", sortOrder: 1 },
  { parentPath: "/jewellery/kids-jewellery", slug: "chains", name: "Kids' Chains", sortOrder: 2 },
  { parentPath: "/jewellery/kids-jewellery", slug: "nazariya", name: "Kids' Nazariya", sortOrder: 3 },
];

async function main(mode: "dry-run" | "apply") {
  const dbUrl = process.env.DATABASE_URL ?? "(DATABASE_URL unset)";
  // Mask credentials in the printed URL — show host + db only.
  const safeDbUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");

  console.log("=".repeat(72));
  console.log(`BRENSTA Jewellery taxonomy seed — mode: ${mode}`);
  console.log(`target database: ${safeDbUrl}`);
  console.log(`timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(72));

  // ── Load every path we'll touch for existence check (no writes) ──
  const topLevelPaths = NEW_TOP_LEVEL.map((t) => `/jewellery/${t.slug}`);
  const depth2Paths = NEW_DEPTH_2.map((d) => `${d.parentPath}/${d.slug}`);
  const parentPathsNeeded = Array.from(new Set(["/jewellery", ...NEW_DEPTH_2.map((d) => d.parentPath)]));

  const [existingParents, existingNew] = await Promise.all([
    prisma.category.findMany({
      where: { path: { in: parentPathsNeeded } },
      select: { id: true, path: true, depth: true, status: true },
    }),
    prisma.category.findMany({
      where: { path: { in: [...topLevelPaths, ...depth2Paths] } },
      select: { id: true, path: true, name: true, showInMenu: true, status: true, sortOrder: true },
    }),
  ]);

  const parentByPath = new Map(existingParents.map((p) => [p.path, { id: p.id, depth: p.depth }]));
  const existingByPath = new Map(existingNew.map((e) => [e.path, e]));

  // ── Pre-flight checks ──
  console.log("\n── Parent paths (must all exist for depth-2 writes) ──");
  const missingDepth2Parents: string[] = [];
  for (const p of parentPathsNeeded) {
    const row = parentByPath.get(p);
    if (row) {
      console.log(`  OK   ${p.padEnd(44)} id=${row.id} depth=${row.depth}`);
    } else {
      // Depth-2 parents that are NEW top-level will be created in Step 1 of
      // apply — only flag them if the paired top-level is missing from the
      // NEW_TOP_LEVEL list (would be a config error, not a DB state issue).
      const topLevelSlug = p.split("/")[2];
      const isPendingNewTopLevel = NEW_TOP_LEVEL.some((t) => t.slug === topLevelSlug);
      if (!isPendingNewTopLevel) {
        missingDepth2Parents.push(p);
        console.log(`  MISS ${p.padEnd(44)} (not in DB AND not scheduled to be created)`);
      } else {
        console.log(`  NEW  ${p.padEnd(44)} (will be created in Step 1)`);
      }
    }
  }
  if (missingDepth2Parents.length) {
    throw new Error(`Aborting: missing parent paths: ${missingDepth2Parents.join(", ")}`);
  }

  // ── Step 1 report ──
  console.log(`\n── Step 1: ${NEW_TOP_LEVEL.length} new top-level categories ──`);
  let step1Create = 0;
  let step1Skip = 0;
  for (const t of NEW_TOP_LEVEL) {
    const path = `/jewellery/${t.slug}`;
    const existing = existingByPath.get(path);
    if (existing) {
      step1Skip++;
      console.log(`  [skip]   ${path.padEnd(44)} id=${existing.id}`);
    } else {
      step1Create++;
      console.log(`  [create] ${path.padEnd(44)} name="${t.name}" sort=${t.sortOrder} showInMenu=true`);
    }
  }

  // ── Step 2 report ──
  console.log(`\n── Step 2: ${NEW_DEPTH_2.length} new depth-2 subcategories ──`);
  let step2Create = 0;
  let step2Skip = 0;
  for (const d of NEW_DEPTH_2) {
    const path = `${d.parentPath}/${d.slug}`;
    const existing = existingByPath.get(path);
    if (existing) {
      step2Skip++;
      console.log(`  [skip]   ${path.padEnd(56)} id=${existing.id}`);
    } else {
      step2Create++;
      console.log(`  [create] ${path.padEnd(56)} name="${d.name}" sort=${d.sortOrder} showInMenu=false`);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Top-level     create=${step1Create}  skip=${step1Skip}`);
  console.log(`  Depth-2       create=${step2Create}  skip=${step2Skip}`);
  console.log(`  TOTAL new rows planned: ${step1Create + step2Create}`);
  console.log(`  TOTAL already-present (idempotent skip): ${step1Skip + step2Skip}`);

  if (mode === "dry-run") {
    console.log("\n=== DRY RUN — no writes performed. Re-run with --apply to execute. ===");
    return;
  }

  // ── APPLY ──
  console.log("\n=== APPLYING in a single transaction ===");
  const createdPaths: string[] = [];
  await prisma.$transaction(async (tx) => {
    const jewellery = parentByPath.get("/jewellery");
    if (!jewellery) throw new Error("`/jewellery` not found — aborting.");

    // Step 1 — new top-level
    for (const t of NEW_TOP_LEVEL) {
      const path = `/jewellery/${t.slug}`;
      const existing = await tx.category.findUnique({ where: { path }, select: { id: true } });
      if (existing) continue; // idempotent
      await tx.category.create({
        data: {
          name: t.name,
          slug: t.slug,
          parentId: jewellery.id,
          path,
          depth: jewellery.depth + 1,
          status: PublishStatus.PUBLISHED,
          showInMenu: true, // owner-selected for main menu
          sortOrder: t.sortOrder,
        },
      });
      createdPaths.push(path);
    }

    // Refresh parent map so Step 2 can look up the freshly-created top-levels.
    const freshParents = await tx.category.findMany({
      where: { path: { in: parentPathsNeeded } },
      select: { id: true, path: true, depth: true },
    });
    const parentByPathFresh = new Map(freshParents.map((p) => [p.path, { id: p.id, depth: p.depth }]));

    // Step 2 — depth-2 subcategories
    for (const d of NEW_DEPTH_2) {
      const parent = parentByPathFresh.get(d.parentPath);
      if (!parent) throw new Error(`Parent not found: ${d.parentPath}`);
      const path = `${d.parentPath}/${d.slug}`;
      const existing = await tx.category.findUnique({ where: { path }, select: { id: true } });
      if (existing) continue; // idempotent
      await tx.category.create({
        data: {
          name: d.name,
          slug: d.slug,
          parentId: parent.id,
          path,
          depth: parent.depth + 1,
          status: PublishStatus.PUBLISHED,
          showInMenu: false, // owner curates individually
          sortOrder: d.sortOrder,
        },
      });
      createdPaths.push(path);
    }
  });

  console.log(`\nTransaction committed. ${createdPaths.length} new rows created.`);
  console.log("\n── Rollback paths (save this for an emergency undo) ──");
  console.log(JSON.stringify(createdPaths, null, 2));
}

const mode = process.argv.includes("--apply") ? "apply" : "dry-run";
main(mode)
  .catch((e) => {
    console.error("\n✗ SEED FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
