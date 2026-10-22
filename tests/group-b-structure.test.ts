/**
 * Structural regression guards for the Group B fixes.
 * These assert source-level patterns stay in place; browser-level behaviour
 * (keyboard focus restoration, screen-reader output) still needs the Chrome
 * extension pass.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("empty-state H1 on cart/wishlist", () => {
  it("cart passes as='h1' to EmptyState", () => {
    const src = read("app/(storefront)/cart/page.tsx");
    expect(src).toMatch(/<EmptyState[\s\S]*?as=["']h1["'][\s\S]*?title=["']Your cart is empty["']/);
  });
  it("wishlist passes as='h1' to EmptyState", () => {
    const src = read("app/(storefront)/wishlist/page.tsx");
    expect(src).toMatch(/<EmptyState[\s\S]*?as=["']h1["'][\s\S]*?title=["']Your wishlist is empty["']/);
  });
});

describe("cart + wishlist pluralization uses pluralize()", () => {
  it("cart uses pluralize('item')", () => {
    const src = read("app/(storefront)/cart/page.tsx");
    expect(src).toMatch(/pluralize\([^)]+,\s*["']item["']\)/);
    // Legacy raw " items" with no plural fork is gone.
    expect(src).not.toMatch(/\$\{[^}]+\}\s*items</);
  });
  it("wishlist uses pluralize('item')", () => {
    const src = read("app/(storefront)/wishlist/page.tsx");
    expect(src).toMatch(/pluralize\(items\.length,\s*["']item["']\)/);
  });
  it("search uses pluralize('result')", () => {
    const src = read("app/(storefront)/search/page.tsx");
    expect(src).toMatch(/pluralize\(total,\s*["']result["']\)/);
  });
});

describe("AccountMenu accessibility", () => {
  const src = read("components/layout/AccountMenu.tsx");
  it("trigger has aria-label naming the user", () => {
    expect(src).toMatch(/aria-label=\{`Account menu for \$\{firstName\}`\}/);
  });
  it("trigger declares aria-haspopup=\"menu\" and reflects aria-expanded as boolean", () => {
    expect(src).toMatch(/aria-haspopup=["']menu["']/);
    expect(src).toMatch(/aria-expanded=\{open\}/);
  });
  it("Escape restores focus to the trigger", () => {
    expect(src).toMatch(/triggerRef\.current\?\.focus\(\)/);
  });
  it("menu panel is role=\"menu\" and linked by aria-controls", () => {
    expect(src).toMatch(/role=["']menu["']/);
    expect(src).toMatch(/aria-controls=\{menuId\}/);
  });
});

describe("MegaMenu accessibility", () => {
  const src = read("components/layout/MegaMenu.tsx");
  it("aria-expanded is always a boolean (not undefined when closed)", () => {
    expect(src).toMatch(/aria-expanded=\{hasChildren\s*\?\s*isOpen\s*:\s*undefined\}/);
    // The old "? true : undefined" bug (returning only when open) is gone.
    expect(src).not.toMatch(/aria-expanded=\{openId === c\.id \? true : undefined\}/);
  });
  it("Escape handler calls focus() on the stored trigger ref", () => {
    expect(src).toMatch(/activeTrigger\?\.focus\(\)/);
  });
  it("panel has aria-controls id matching the trigger", () => {
    expect(src).toMatch(/aria-controls=\{hasChildren\s*\?\s*`megamenu-panel-\$\{c\.id\}`\s*:\s*undefined\}/);
    expect(src).toMatch(/id=\{`megamenu-panel-\$\{c\.id\}`\}/);
  });
});

describe("AddressForm autocomplete + input types", () => {
  const src = read("components/account/AddressForm.tsx");
  const expected = [
    ['name', 'autoComplete="name"'],
    ['phone (type tel)', 'type="tel"'],
    ['phone (autocomplete)', 'autoComplete="tel-national"'],
    ['line1', 'autoComplete="address-line1"'],
    ['line2', 'autoComplete="address-line2"'],
    ['city', 'autoComplete="address-level2"'],
    ['state', 'autoComplete="address-level1"'],
    ['pincode', 'autoComplete="postal-code"'],
  ] as const;
  for (const [name, pattern] of expected) {
    it(`sets ${name}`, () => {
      expect(src).toContain(pattern);
    });
  }
});

describe("Admin SettingsForm", () => {
  const src = read("app/(admin)/admin/settings/SettingsForm.tsx");
  it("has a label map keyed by the known setting dot-keys", () => {
    expect(src).toContain("SETTING_META");
    expect(src).toMatch(/"contact\.email":\s*\{[^}]*label:\s*"Support email"/);
    expect(src).toMatch(/"contact\.phone":\s*\{[^}]*label:\s*"Support phone"/);
  });
  it("renders the human label, not the raw key, in the FormField", () => {
    expect(src).toContain("label={meta.label}");
    expect(src).not.toContain("label={key}");
  });
});
