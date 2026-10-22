/**
 * Group C regression guards: SEO metadata, canonicals, sitemap entries +
 * exclusions, policy robots inheritance.
 *
 * These are source-level patterns. Full canonical / sitemap XML verification
 * still needs a running dev server (see the browser-check list in the commit
 * message).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { categoryHasProductsInSubtree } from "@/lib/sitemap-utils";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("categoryHasProductsInSubtree", () => {
  it("returns true when the exact path has a product", () => {
    const paths = new Set(["/jewellery/earrings"]);
    expect(categoryHasProductsInSubtree("/jewellery/earrings", paths)).toBe(true);
  });
  it("returns true for a parent whose descendant has a product", () => {
    const paths = new Set(["/jewellery/earrings/jhumkas"]);
    expect(categoryHasProductsInSubtree("/jewellery", paths)).toBe(true);
    expect(categoryHasProductsInSubtree("/jewellery/earrings", paths)).toBe(true);
  });
  it("returns false for a sibling with no products", () => {
    const paths = new Set(["/jewellery/earrings/jhumkas"]);
    expect(categoryHasProductsInSubtree("/jewellery/necklaces", paths)).toBe(false);
  });
  it("does not treat a path prefix as a parent (/foo is not an ancestor of /foobar)", () => {
    const paths = new Set(["/foobar"]);
    expect(categoryHasProductsInSubtree("/foo", paths)).toBe(false);
  });
  it("returns false for an empty set", () => {
    expect(categoryHasProductsInSubtree("/anything", new Set())).toBe(false);
  });
});

describe("self-referencing canonicals on list pages", () => {
  it("/shop has canonical '/shop'", () => {
    const src = read("app/(storefront)/shop/page.tsx");
    expect(src).toMatch(/alternates:\s*\{\s*canonical:\s*["']\/shop["']/);
  });
  it("/c/[...slug] builds a self-referencing canonical from the path", () => {
    const src = read("app/(storefront)/c/[...slug]/page.tsx");
    expect(src).toMatch(/alternates:\s*\{\s*canonical:\s*`\/c\$\{path\}`\s*\}/);
  });
});

describe("page titles do not duplicate BRENSTA", () => {
  it("about page uses a bare title (template adds | BRENSTA)", () => {
    const src = read("app/(storefront)/about/page.tsx");
    expect(src).toMatch(/title:\s*["']About["']/);
    expect(src).not.toMatch(/title:\s*["']About BRENSTA["']/);
  });
  it("contact page uses a bare title", () => {
    const src = read("app/(storefront)/contact/page.tsx");
    expect(src).toMatch(/title:\s*["']Contact["']/);
    expect(src).not.toMatch(/title:\s*["']Contact BRENSTA["']/);
  });
  it("product generateMetadata detects BRENSTA in seoTitle and uses { absolute } to bypass the template", () => {
    const src = read("app/(storefront)/p/[slug]/page.tsx");
    expect(src).toMatch(/\/brensta\/i\.test\(rawTitle\)/);
    expect(src).toMatch(/\{\s*absolute:\s*rawTitle\s*\}/);
  });
  it("category generateMetadata applies the same brand-dedupe", () => {
    const src = read("app/(storefront)/c/[...slug]/page.tsx");
    expect(src).toMatch(/\/brensta\/i\.test\(rawTitle\)/);
  });
});

describe("sitemap entries + exclusions", () => {
  const src = read("app/sitemap.ts");
  it("includes /about, /contact, /shop and homepage", () => {
    expect(src).toContain('/about');
    expect(src).toContain('/contact');
    expect(src).toContain('/shop');
    expect(src).toMatch(/`\$\{base\}\/`/);
  });
  it("includes public policy pages via POLICY_SLUGS", () => {
    expect(src).toContain('import { POLICY_SLUGS } from "@/lib/policies"');
    expect(src).toMatch(/`\$\{base\}\/p\/policies\/\$\{slug\}`/);
  });
  it("filters categories that have no products in their subtree", () => {
    expect(src).toContain("categoryHasProductsInSubtree");
    expect(src).toContain("nonEmptyCategories");
    // Must not emit the raw category list unfiltered any more.
    expect(src).not.toMatch(/\.\.\.categories\.map\(\(c\)\s*=>/);
  });
});

describe("policy robots inherit env-aware root setting", () => {
  const raw = read("app/(storefront)/p/policies/[slug]/page.tsx");
  // Strip // line comments and /* */ block comments so a cautionary comment
  // doesn't trip the "no robots override" assertion.
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  it("the metadata object no longer sets robots:", () => {
    expect(code).not.toMatch(/robots:\s*\{/);
  });
  it("explains the inheritance intent in a comment", () => {
    expect(raw).toMatch(/environment-aware robots/i);
  });
});
