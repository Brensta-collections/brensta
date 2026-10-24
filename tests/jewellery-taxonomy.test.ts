/**
 * Structural guards for the Jewellery taxonomy expansion (Phase A).
 *
 * These validate the SEED SCRIPT shape without touching the DB — so they
 * pass before and after the owner-approved apply. Expected row counts
 * (16 top-level, 89 total new, 101 depth-2 after apply) are pinned so a
 * silent accidental edit to the taxonomy list fails this test loudly.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("Jewellery taxonomy seed script", () => {
  const src = read("prisma/seed-jewellery-taxonomy.ts");

  it("defaults to dry-run; applies only with --apply flag", () => {
    expect(src).toMatch(/process\.argv\.includes\("--apply"\) \? "apply" : "dry-run"/);
    expect(src).toMatch(/if \(mode === "dry-run"\)[\s\S]{0,200}no writes performed/);
  });

  it("masks DB credentials in the printed URL", () => {
    expect(src).toMatch(/\/\/\*\*\*:\*\*\*@/);
  });

  it("wraps the apply branch in a single transaction", () => {
    expect(src).toMatch(/await prisma\.\$transaction\(async \(tx\) => \{/);
  });

  it("is idempotent — skips rows whose path already exists (no overwrite of existing categories)", () => {
    // Both Step 1 and Step 2 look up by `path` and `continue` if present.
    const applyBlock = src.slice(src.indexOf("APPLYING in a single transaction"));
    expect(applyBlock).toMatch(/if \(existing\) continue; \/\/ idempotent/);
    // Count both idempotency guards (one for top-level, one for depth-2).
    const matches = applyBlock.match(/if \(existing\) continue;/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("creates NEW top-level with showInMenu=true (owner-selected for main menu)", () => {
    const topLevelCreate = src.slice(src.indexOf("Step 1 — new top-level"));
    expect(topLevelCreate).toMatch(/showInMenu:\s*true,\s*\/\/ owner-selected/);
  });

  it("creates NEW depth-2 with showInMenu=false (owner curates individually)", () => {
    const depth2Create = src.slice(src.indexOf("Step 2 — depth-2 subcategories"));
    expect(depth2Create).toMatch(/showInMenu:\s*false,\s*\/\/ owner curates/);
  });

  it("prints a rollback-paths JSON after a successful apply", () => {
    expect(src).toMatch(/Rollback paths \(save this for an emergency undo\)/);
    expect(src).toMatch(/JSON\.stringify\(createdPaths/);
  });

  it("declares exactly 6 new top-level categories", () => {
    // Counts the top-level literal entries by scanning only the NEW_TOP_LEVEL list.
    const list = src.match(/const NEW_TOP_LEVEL: NewTopLevel\[\] = \[[\s\S]+?\];/)![0];
    const entries = list.match(/\{\s*slug:/g) ?? [];
    expect(entries).toHaveLength(6);
  });

  it("declares 83 new depth-2 categories across the 16 top-level jewellery parents", () => {
    const list = src.match(/const NEW_DEPTH_2: NewDepth2\[\] = \[[\s\S]+?\];/)![0];
    const entries = list.match(/\{\s*parentPath:/g) ?? [];
    expect(entries).toHaveLength(83);
  });

  it("covers all 16 top-level parents in NEW_DEPTH_2 (10 existing + 6 new)", () => {
    const list = src.match(/const NEW_DEPTH_2: NewDepth2\[\] = \[[\s\S]+?\];/)![0];
    const parentPaths = Array.from(
      new Set(Array.from(list.matchAll(/parentPath: "([^"]+)"/g)).map((m) => m[1])),
    );
    expect(parentPaths.sort()).toEqual(
      [
        "/jewellery/anklets",
        "/jewellery/bangles",
        "/jewellery/bracelets",
        "/jewellery/brooches-pins",
        "/jewellery/earrings",
        "/jewellery/hair-jewellery",
        "/jewellery/jewellery-sets",
        "/jewellery/kids-jewellery",
        "/jewellery/maang-tikka",
        "/jewellery/mangalsutras",
        "/jewellery/mens-jewellery",
        "/jewellery/necklaces",
        "/jewellery/nose-jewellery",
        "/jewellery/pendants",
        "/jewellery/rings",
        "/jewellery/waist-jewellery",
      ].sort(),
    );
  });

  it("no (parentPath, slug) collisions within NEW_DEPTH_2 — each row would create a unique path", () => {
    const list = src.match(/const NEW_DEPTH_2: NewDepth2\[\] = \[[\s\S]+?\];/)![0];
    const combos = Array.from(list.matchAll(/parentPath: "([^"]+)", slug: "([^"]+)"/g)).map(
      (m) => `${m[1]}/${m[2]}`,
    );
    const unique = new Set(combos);
    expect(unique.size).toBe(combos.length);
  });

  it("does NOT recreate /jewellery/jhumkas (deleted by the earlier migrate-jewellery)", () => {
    expect(src).not.toMatch(/\/jewellery\/jhumkas\b/);
  });
});

describe("CategoryForm — showInMenu defaults to false for new categories", () => {
  const src = read("components/admin/CategoryForm.tsx");

  it("initial-state default is false, not true", () => {
    expect(src).toMatch(/showInMenu:\s*initial\?\.showInMenu\s*\?\?\s*false/);
    // The old permissive default must not come back.
    expect(src).not.toMatch(/showInMenu:\s*initial\?\.showInMenu\s*\?\?\s*true/);
  });

  it("documents the rationale so a future reviewer doesn't quietly revert", () => {
    expect(src).toMatch(/Default FALSE for brand-new categories/i);
  });
});

describe("Jewellery landing page view", () => {
  const pageSrc = read("app/(storefront)/c/[...slug]/page.tsx");
  const gridSrc = read("components/storefront/JewelleryLandingGrid.tsx");

  it("the catch-all category page branches into the special landing when path === /jewellery", () => {
    expect(pageSrc).toContain('import { JewelleryLandingGrid }');
    expect(pageSrc).toMatch(/if \(path === "\/jewellery"\)/);
    expect(pageSrc).toMatch(/<JewelleryLandingGrid[\s\S]{0,400}categoryName=\{category\.name\}/);
  });

  it("hero cards are earrings / necklaces / rings / bangles", () => {
    expect(gridSrc).toMatch(/const HERO_SLUGS[\s\S]{0,120}"earrings",[\s\S]{0,20}"necklaces",[\s\S]{0,20}"rings",[\s\S]{0,20}"bangles"/);
  });

  it("non-hero categories fall into the 'Explore all jewellery' grid", () => {
    expect(gridSrc).toMatch(/Explore all jewellery/);
  });

  it("non-jewellery category pages still use the existing chip row (no regression)", () => {
    expect(pageSrc).toMatch(/visibleChildren\.length > 0 &&/);
  });
});

describe("Admin category tree — expandable", () => {
  const src = read("app/(admin)/admin/categories/CategoryTree.tsx");

  it("builds a tree from the flat list and renders children recursively", () => {
    expect(src).toContain("function buildTree");
    expect(src).toMatch(/node\.children\.map/);
  });

  it("depth-0 roots start expanded; everything else collapsed", () => {
    expect(src).toMatch(/if \(n\.depth === 0\) open\.add\(n\.id\)/);
  });

  it("exposes 'Expand all' + 'Collapse to roots' controls", () => {
    expect(src).toMatch(/Expand all/);
    expect(src).toMatch(/Collapse to roots/);
  });

  it("preserves every per-row action from the previous flat list", () => {
    // Each one of these must still have a button hooked up.
    expect(src).toMatch(/aria-label="Move up"/);
    expect(src).toMatch(/aria-label="Move down"/);
    expect(src).toMatch(/aria-label="Toggle visibility"/);
    expect(src).toMatch(/aria-label="Edit"/);
    expect(src).toMatch(/aria-label="Delete"/);
  });

  it("chevron toggle carries correct aria-expanded + aria-label", () => {
    expect(src).toMatch(/aria-expanded=\{isOpen\}/);
    expect(src).toMatch(/aria-label=\{isOpen \? `Collapse \$\{node\.name\}` : `Expand \$\{node\.name\}`\}/);
  });
});
