/**
 * Group D regression guard: the admin shell must constrain its content column
 * via min-w-0 so wide children (notably the products table) scroll inside
 * their own wrapper instead of pushing the topbar controls off-screen.
 *
 * Visual verification at a narrow viewport (~893px) still needs the Chrome
 * extension — see the browser-check list in the commit message.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("admin shell contains its content column", () => {
  const src = read("app/(admin)/admin/layout.tsx");
  it("flex column wrapping topbar + main carries min-w-0", () => {
    // Exact class string from the layout — if this breaks a reviewer will
    // notice and can re-check viewport behaviour.
    expect(src).toMatch(/className="flex min-h-screen min-w-0 flex-1 flex-col"/);
  });
  it("main element carries min-w-0", () => {
    expect(src).toMatch(/<main[^>]*className="min-w-0 flex-1[^"]*"/);
  });
});

describe("admin products table wrapper allows horizontal scroll", () => {
  const src = read("app/(admin)/admin/products/page.tsx");
  it("uses overflow-x-auto, not overflow-hidden, around the table", () => {
    expect(src).toMatch(/<div className="overflow-x-auto rounded-xl border border-brand-line bg-white">/);
    // The old clipping wrapper is gone — if someone reverts it we want to
    // know, because clipping re-introduces the topbar push-off bug on
    // narrow viewports.
    expect(src).not.toMatch(/<div className="overflow-hidden rounded-xl border border-brand-line bg-white">/);
  });
});
