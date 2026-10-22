/**
 * Regression guards for the header/menu accessibility fix:
 *   1. MegaMenu Escape no longer re-opens the panel (the onFocus opener is gone).
 *   2. Header layout fits at 1280px (logo shrink-protected, MegaMenu moved to xl:).
 *   3. HeaderSearch prefills from ?q when on /search.
 *   4. AccountMenu moves focus into the first item when opened via keyboard
 *      and supports ArrowUp/ArrowDown cycling.
 *
 * These are source-level patterns — visual + interactive behaviour at the
 * actual viewport still needs the Chrome extension pass (see commit).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("MegaMenu — Escape no longer re-opens via onFocus", () => {
  const src = read("components/layout/MegaMenu.tsx");
  it("the trigger no longer has an onFocus opener (the Escape → reopen cycle)", () => {
    // onFocus={() => hasChildren && setOpenId(c.id)} is the exact bug source.
    expect(src).not.toMatch(/onFocus=\{\(\)\s*=>\s*hasChildren\s*&&\s*setOpenId/);
    // And broadly: no onFocus handler on the trigger Link at all.
    expect(src).not.toMatch(/<Link[^>]*onFocus=/);
  });
  it("ArrowDown opens the submenu and moves focus into the first item", () => {
    expect(src).toMatch(/e\.key === "ArrowDown"/);
    expect(src).toMatch(/focusFirstPanelItem\(/);
  });
  it("Escape closes the menu and restores focus to the trigger", () => {
    expect(src).toMatch(/if \(e\.key === "Escape"\)/);
    expect(src).toMatch(/activeTrigger\?\.focus\(\)/);
  });
  it("panel supports ArrowUp / ArrowDown / Home / End for cycling", () => {
    expect(src).toMatch(/onPanelKeyDown/);
    expect(src).toMatch(/"ArrowUp"/);
    expect(src).toMatch(/"Home"/);
    expect(src).toMatch(/"End"/);
  });
});

describe("Header layout — logo/nav overlap at 1280px", () => {
  const src = read("components/layout/Header.tsx");
  it("left (logo + hamburger) container is shrink-0, not min-w-0", () => {
    expect(src).toMatch(/shrink-0 items-center gap-1 md:gap-4/);
    expect(src).not.toMatch(/flex min-w-0 items-center gap-1 md:gap-4/);
  });

  const mega = read("components/layout/MegaMenu.tsx");
  it("MegaMenu only renders at xl+ (so the lg-xl range uses the hamburger)", () => {
    expect(mega).toMatch(/xl:flex/);
    // Must not render at md any more.
    expect(mega).not.toMatch(/\bmd:flex\b/);
  });

  const mobile = read("components/layout/MobileNav.tsx");
  it("mobile hamburger is visible through lg (xl:hidden), not just below md", () => {
    // Trigger + overlay should both use xl:hidden.
    expect(mobile).toMatch(/className="flex h-10 w-10 items-center justify-center rounded-md text-charcoal xl:hidden"/);
    expect(mobile).toMatch(/className="fixed inset-0 z-50 flex xl:hidden"/);
    expect(mobile).not.toMatch(/md:hidden/);
  });

  const acct = read("components/layout/AccountMenu.tsx");
  it("'Hi, {firstName}' is deferred to 2xl so the xl header still fits", () => {
    expect(acct).toMatch(/2xl:inline[^"]*">Hi, \{firstName\}</);
    expect(acct).not.toMatch(/lg:inline[^"]*">Hi, \{firstName\}</);
  });
});

describe("HeaderSearch — reflects ?q on /search", () => {
  const src = read("components/layout/HeaderSearch.tsx");
  it("reads pathname + searchParams to compute the committed URL q", () => {
    expect(src).toContain('import { usePathname, useRouter, useSearchParams } from "next/navigation"');
    expect(src).toMatch(/pathname === "\/search"/);
    expect(src).toMatch(/searchParams\.get\("q"\)/);
  });
  it("uses the derived-state-reset pattern (no setState inside useEffect)", () => {
    expect(src).toMatch(/if \(urlQ !== lastUrlQ\)/);
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*if \(pathname === "\/search"\)/);
  });
  it("submission still routes to /search?q=<encoded>", () => {
    expect(src).toMatch(/router\.push\(`\/search\?q=\$\{encodeURIComponent\(query\)\}`\)/);
  });
});

describe("AccountMenu — keyboard semantics", () => {
  const src = read("components/layout/AccountMenu.tsx");
  it("ArrowDown on the trigger opens the menu + flags keyboard open", () => {
    expect(src).toMatch(/if \(e\.key === "ArrowDown"\)/);
    expect(src).toMatch(/openedByKeyboard\.current = true/);
  });
  it("Enter/Space on the trigger (detail === 0) also flag keyboard open", () => {
    expect(src).toMatch(/e\.detail === 0/);
  });
  it("effect moves focus to the first menuitem when keyboard-opened", () => {
    expect(src).toMatch(/menuRef\.current\?\.querySelector<HTMLElement>\('\[role="menuitem"\]'\)/);
  });
  it("ArrowUp / ArrowDown / Home / End cycle items while the menu is open", () => {
    expect(src).toMatch(/"ArrowUp"/);
    expect(src).toMatch(/"Home"/);
    expect(src).toMatch(/"End"/);
  });
  it("Escape still closes and restores focus to the trigger", () => {
    expect(src).toMatch(/if \(e\.key === "Escape"\)/);
    expect(src).toMatch(/triggerRef\.current\?\.focus\(\)/);
  });
});
