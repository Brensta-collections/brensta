/**
 * Group E regression guard: /search must render an on-page search form on
 * every viewport, because the header's full search field is lg-only and the
 * header magnifier navigates to /search with no query parameter below lg.
 *
 * Interactive behaviour (keyboard submit, mobile keypad hint) still needs a
 * browser check — see the commit message.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("SearchForm component", () => {
  const src = read("app/(storefront)/search/SearchForm.tsx");
  it("is a plain GET form targeting /search so it works without JS", () => {
    expect(src).toMatch(/<form[^>]*action="\/search"[^>]*method="get"/);
  });
  it("declares role=\"search\" for assistive tech", () => {
    expect(src).toMatch(/role="search"/);
  });
  it("has an accessible label linked to the input", () => {
    expect(src).toMatch(/htmlFor="search-q"/);
    expect(src).toMatch(/id="search-q"/);
    expect(src).toMatch(/Search products/);
  });
  it("input is name=\"q\" with a defaultValue bound to the prop", () => {
    expect(src).toMatch(/name="q"/);
    expect(src).toMatch(/defaultValue=\{defaultQ\}/);
    expect(src).toMatch(/type="search"/);
  });
  it("has a visible submit button (not icon-only)", () => {
    expect(src).toMatch(/<button[^>]*type="submit"[\s\S]*?>\s*Search\s*</);
  });
  it("hints the mobile keyboard to show a Search key", () => {
    expect(src).toMatch(/enterKeyHint="search"/);
  });
  it("does not autofocus (would pop the mobile keyboard on load)", () => {
    expect(src).not.toMatch(/\bautoFocus\b/);
  });
});

describe("/search page uses SearchForm in both branches", () => {
  const src = read("app/(storefront)/search/page.tsx");
  it("imports the form", () => {
    expect(src).toContain('import { SearchForm } from "./SearchForm"');
  });
  it("renders the form with an empty default in the no-query branch", () => {
    expect(src).toMatch(/<SearchForm defaultQ=""/);
  });
  it("renders the form prepopulated with the current q in the results branch", () => {
    expect(src).toMatch(/<SearchForm defaultQ=\{q\}/);
  });
  it("still uses pluralize for the result count (no regression on Group B)", () => {
    expect(src).toMatch(/pluralize\(total,\s*["']result["']\)/);
  });
});
