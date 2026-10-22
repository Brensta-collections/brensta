/**
 * Regression guards for the mobile navigation drawer rebuild.
 *
 * The Chrome-extension audit found the drawer was being clipped to the
 * header's 64px bounding box because the header's backdrop-filter creates
 * a new containing block for descendant position:fixed elements. The fix
 * portals the drawer to <body>. These tests lock in the source-level
 * patterns that keep the drawer accessible and viewport-sized.
 *
 * Interactive behaviour (actual focus movement across viewports, keyboard
 * trapping with a real tab order, scroll-lock cleanup after navigation)
 * still needs the Chrome-extension pass.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("MobileNav — portal + viewport-sized drawer", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("portals the drawer to document.body so backdrop-filter can't clip it", () => {
    expect(src).toContain('import { createPortal } from "react-dom"');
    expect(src).toMatch(/createPortal\(drawer,\s*document\.body\)/);
  });

  it("only portals when the drawer is actually open (SSR-safe — document.body is unused during server render)", () => {
    // `open` starts false, so during SSR + the first client render the
    // conditional `drawer` constant is false and createPortal is never
    // called. The user's click handler runs post-hydration, by which point
    // document.body exists.
    expect(src).toMatch(/drawer \? createPortal\(drawer, document\.body\) : null/);
  });

  it("drawer uses z-[60] (above the z-40 header) and remains xl:hidden", () => {
    expect(src).toMatch(/"fixed inset-0 z-\[60\] flex xl:hidden"/);
  });

  it("the drawer panel is a flex column with h-full so it fills the viewport", () => {
    expect(src).toMatch(/"flex h-full w-\[86%\] max-w-sm flex-col/);
  });
});

describe("MobileNav — dialog ARIA + trigger wiring", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("drawer declares role=dialog, aria-modal and aria-labelledby", () => {
    expect(src).toMatch(/role="dialog"/);
    expect(src).toMatch(/aria-modal="true"/);
    expect(src).toMatch(/aria-labelledby=\{titleId\}/);
  });

  it("the labelled-by target is a hidden h2 with meaningful text", () => {
    expect(src).toMatch(/<h2 id=\{titleId\} className="sr-only">Site navigation<\/h2>/);
  });

  it("hamburger trigger declares aria-expanded, aria-controls, aria-haspopup", () => {
    expect(src).toMatch(/aria-expanded=\{open\}/);
    expect(src).toMatch(/aria-controls=\{drawerId\}/);
    expect(src).toMatch(/aria-haspopup="dialog"/);
  });
});

describe("MobileNav — keyboard + focus management", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("Escape closes the drawer from any view", () => {
    expect(src).toMatch(/if \(e\.key === "Escape"\)[\s\S]{0,100}setOpen\(false\)/);
  });

  it("installs a Tab-key focus trap over the drawer's focusable descendants", () => {
    expect(src).toContain("FOCUSABLE_SELECTOR");
    expect(src).toMatch(/if \(e\.shiftKey\)/);
    // Cycle: last-element Tab wraps to first; first-element Shift+Tab wraps to last.
    expect(src).toMatch(/items\[0\]\.focus\(\)/);
    expect(src).toMatch(/items\[items\.length - 1\]\.focus\(\)/);
  });

  it("moves focus into the drawer on open and restores it on close", () => {
    expect(src).toMatch(/first\?\.focus\(\)/);
    expect(src).toMatch(/triggerRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
    // The initial-mount guard prevents us stealing focus on first render.
    expect(src).toMatch(/wasOpenRef/);
  });

  it("submenu Back returns focus to the category button that opened it", () => {
    expect(src).toContain("submenuOpenerRef");
    expect(src).toMatch(/data-mobilenav-back="true"/);
  });
});

describe("MobileNav — background scroll lock", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("locks body overflow while the drawer is open and restores the previous value on close", () => {
    expect(src).toMatch(/const prev = document\.body\.style\.overflow;/);
    expect(src).toMatch(/document\.body\.style\.overflow = "hidden";/);
    expect(src).toMatch(/document\.body\.style\.overflow = prev;/);
  });
});

describe("MobileNav — session-aware navigation state", () => {
  const src = read("components/layout/MobileNav.tsx");

  it("reads session from next-auth (shared with AccountMenu — no new auth source)", () => {
    expect(src).toContain('import { useSession, signOut } from "next-auth/react"');
    expect(src).toMatch(/useSession\(\)/);
  });

  it("renders Login only for signed-out visitors; signed-in users see My Account + Sign out", () => {
    // Branch structure: signedIn ? ( …My Account… …Sign out… ) : ( …Login… )
    expect(src).toMatch(/signedIn \? \([\s\S]+?My Account[\s\S]+?Sign out[\s\S]+?\) : \([\s\S]+?Login/);
    expect(src).toMatch(/void signOut\(\{ callbackUrl: "\/" \}\)/);
  });

  it("hides sign-in CTA while the session is loading", () => {
    expect(src).toMatch(/status === "loading" \? null :/);
  });
});
