/**
 * Pure unit tests for lib/search-query. No DB, no Prisma — fast.
 */
import { describe, it, expect } from "vitest";
import { escapeLikeMetachars, buildSearchStems } from "@/lib/search-query";

describe("escapeLikeMetachars", () => {
  it("passes plain strings through unchanged", () => {
    expect(escapeLikeMetachars("")).toBe("");
    expect(escapeLikeMetachars("jewellery")).toBe("jewellery");
    expect(escapeLikeMetachars("pearl drop")).toBe("pearl drop");
  });

  it("escapes a lone percent", () => {
    expect(escapeLikeMetachars("50%")).toBe("50\\%");
  });

  it("escapes a lone underscore", () => {
    expect(escapeLikeMetachars("foo_bar")).toBe("foo\\_bar");
  });

  it("doubles a lone backslash", () => {
    expect(escapeLikeMetachars("back\\slash")).toBe("back\\\\slash");
  });

  it("escapes backslashes BEFORE %, _ so our own escape chars aren't double-escaped", () => {
    // Input: a%b_c\d  →  a\%b\_c\\d
    expect(escapeLikeMetachars("a%b_c\\d")).toBe("a\\%b\\_c\\\\d");
  });

  it("handles multiple metachars across the string", () => {
    expect(escapeLikeMetachars("100% off_sale\\now")).toBe("100\\% off\\_sale\\\\now");
  });

  it("escapes a trailing lone backslash so it can't dangle in the ILIKE pattern", () => {
    expect(escapeLikeMetachars("foo\\")).toBe("foo\\\\");
  });
});

describe("buildSearchStems", () => {
  it("returns [] for empty / whitespace-only input", () => {
    expect(buildSearchStems("")).toEqual([]);
    expect(buildSearchStems("   ")).toEqual([]);
  });

  it("returns the single trimmed term when it doesn't end in 's'", () => {
    expect(buildSearchStems("jewellery")).toEqual(["jewellery"]);
    expect(buildSearchStems("earring")).toEqual(["earring"]);
    expect(buildSearchStems("  pearl  ")).toEqual(["pearl"]);
  });

  it("adds the singular stem when the input ends in a lowercase 's'", () => {
    expect(buildSearchStems("earrings")).toEqual(["earrings", "earring"]);
    expect(buildSearchStems("sarees")).toEqual(["sarees", "saree"]);
    expect(buildSearchStems("bags")).toEqual(["bags", "bag"]);
    expect(buildSearchStems("rings")).toEqual(["rings", "ring"]);
  });

  it("does not strip when the input is only 1 char long", () => {
    expect(buildSearchStems("s")).toEqual(["s"]);
  });

  it("dedupes so a double-s input doesn't produce three entries", () => {
    // "ss" trim → "ss", strip → "s". Two unique entries.
    expect(buildSearchStems("ss")).toEqual(["ss", "s"]);
  });

  it("only strips when the TRAILING character is lowercase 's' — uppercase S is left alone", () => {
    // Keeping the stripper deterministic and lowercase-only avoids edge
    // cases around locale-insensitive casing. The first character's case
    // doesn't affect the rule; the trailing character does.
    expect(buildSearchStems("STUDS")).toEqual(["STUDS"]);
    expect(buildSearchStems("Earrings")).toEqual(["Earrings", "Earring"]);
  });

  it("leaves the original token so plural-in-content still matches a singular query via substring", () => {
    // Searching "earring" should still find "Earrings"-named products through
    // the standard contains-substring behaviour (no stem added).
    const stems = buildSearchStems("earring");
    expect(stems).toContain("earring");
    expect(stems).toHaveLength(1);
  });
});
