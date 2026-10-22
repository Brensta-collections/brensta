/**
 * Code-only regression guards for the jewellery two-level navigation and the
 * Jhumkas → Earrings/Jhumka URL redirect.
 *
 * The actual DB categories (new subcategories, product reassignment, old row
 * retirement) are a separate step pending owner approval — these tests only
 * assert that the FRONTEND and ROUTING are ready to receive that tree.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("lib/categories — fetches two levels for the mega menu", () => {
  const src = read("lib/categories.ts");

  it("includes grandchildren in the root query", () => {
    // The include tree must have children → children → _count.
    // Loose match to tolerate reformatting while still catching an accidental
    // removal of the second-level include.
    expect(src).toMatch(/include:\s*\{\s*children:[\s\S]+?children:\s*\{\s*where:\s*\{\s*status:\s*"PUBLISHED"/);
  });

  it("filters empty grandchildren (no products, no great-grandchildren)", () => {
    expect(src).toMatch(/gc\._count\.products > 0 \|\| gc\._count\.children > 0/);
  });

  it("still filters empty subcategories (regression)", () => {
    expect(src).toMatch(/c\._count\.products > 0 \|\| c\._count\.children > 0/);
  });
});

describe("MegaMenu — switches to 2-level layout when any child has grandchildren", () => {
  const src = read("components/layout/MegaMenu.tsx");

  it("detects whether to render in 2-level mode", () => {
    expect(src).toMatch(/const hasGrandchildren = c\.children\.some\(\(sub\) => sub\.children && sub\.children\.length > 0\)/);
  });

  it("renders grandchildren as a nested menu-item list in 2-level mode", () => {
    expect(src).toMatch(/sub\.children\.map\(\(gc\) =>/);
    expect(src).toMatch(/href=\{`\/c\$\{gc\.path\}`\}/);
    // The grandchild Link must carry role="menuitem" so arrow-key cycling and
    // ARIA menu semantics include it. Window generous enough for Tailwind
    // className strings between the attribute and the text node.
    expect(src).toMatch(/role="menuitem"[\s\S]{0,500}\{gc\.name\}/);
  });

  it("widens the panel in 2-level mode (720px) and keeps 480px for flat jewellery siblings", () => {
    expect(src).toContain("w-[720px]");
    expect(src).toContain("w-[480px]");
  });

  it("keeps the 2-column flat panel when no grandchildren are present (no regression)", () => {
    expect(src).toMatch(/grid grid-cols-2 gap-x-6 gap-y-1\.5/);
  });
});

describe("MobileNav — submenu view surfaces grandchildren", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("renders a nested grandchildren list inside each submenu entry when present", () => {
    expect(src).toMatch(/sub\.children && sub\.children\.length > 0/);
    expect(src).toMatch(/sub\.children\.map\(\(gc\) =>/);
    expect(src).toMatch(/href=\{`\/c\$\{gc\.path\}`\}/);
  });

  it("preserves existing drawer accessibility (focus-trap + Escape reset) — regression", () => {
    expect(src).toContain("openerCategoryIdRef");
    expect(src).toMatch(/role="dialog"/);
  });
});

describe("next.config — permanent redirect for the retired Jhumkas path", () => {
  const src = read("next.config.ts");

  it("defines a 301 for /c/jewellery/jhumkas → /c/jewellery/earrings/jhumka", () => {
    expect(src).toMatch(/source:\s*"\/c\/jewellery\/jhumkas"/);
    expect(src).toMatch(/destination:\s*"\/c\/jewellery\/earrings\/jhumka"/);
    expect(src).toMatch(/permanent:\s*true/);
  });

  it("also redirects any deeper paths underneath (e.g. category pagination links)", () => {
    expect(src).toMatch(/source:\s*"\/c\/jewellery\/jhumkas\/:slug\*"/);
    expect(src).toMatch(/destination:\s*"\/c\/jewellery\/earrings\/jhumka\/:slug\*"/);
  });
});
