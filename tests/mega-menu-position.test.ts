/**
 * Regression tests for the mega-menu clamp.
 *
 * Chrome extension (2026-10-23) observed every mega-menu panel landing at
 * (clamped-left − panelWidth/2) because the inline style only reset
 * `transform` while Tailwind v4 maps `-translate-x-1/2` to the modern CSS
 * `translate` property. The pure-math `clampPanelLeft` was behaving
 * correctly all along; the component's style application was the bug.
 *
 * These tests split responsibility explicitly:
 *   - clampPanelLeft math is unit-tested against the actual boundary
 *     conditions in both panel widths (480, 720) at the three required
 *     viewports (1280, 1440, 1600).
 *   - The component wiring is tested at the source level to pin the exact
 *     property names (`transform` + `translate`) that must be neutralised,
 *     plus the useLayoutEffect + resize listener contract.
 *
 * We deliberately do NOT fabricate "approximate trigger centres" and claim
 * they prove live-DOM correctness — that pattern tricked us into shipping
 * the first iteration. The math is tested across a dense sweep of trigger
 * positions; verifying the live DOM is the browser's job.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { clampPanelLeft } from "@/lib/mega-menu-position";

const GUTTER = 16;
const PANEL_WIDTHS = [480, 720] as const;
const VIEWPORTS = [1280, 1440, 1600] as const;

/**
 * Sweep every integer trigger centre at each viewport so the clamp is
 * exercised exhaustively — not against a hand-picked estimate.
 */
describe("clampPanelLeft — exhaustive sweep across every integer trigger centre", () => {
  for (const viewportWidth of VIEWPORTS) {
    for (const panelWidth of PANEL_WIDTHS) {
      it(`vw=${viewportWidth}, panel=${panelWidth}: holds for every integer trigger centre in [0, vw]`, () => {
        for (let center = 0; center <= viewportWidth; center++) {
          const left = clampPanelLeft({
            triggerLeft: center - 40,  // trigger width 80, arbitrary
            triggerWidth: 80,
            panelWidth,
            viewportWidth,
            gutter: GUTTER,
          });
          expect(left, `center=${center}: left`).toBeGreaterThanOrEqual(GUTTER);
          expect(left + panelWidth, `center=${center}: right`).toBeLessThanOrEqual(viewportWidth - GUTTER);
        }
      });
    }
  }
});

describe("clampPanelLeft — representative boundary cases per viewport", () => {
  for (const viewportWidth of VIEWPORTS) {
    for (const panelWidth of PANEL_WIDTHS) {
      it(`vw=${viewportWidth}, panel=${panelWidth}: trigger at viewport-left → clamp to gutter`, () => {
        const left = clampPanelLeft({
          triggerLeft: 0,
          triggerWidth: 80,
          panelWidth,
          viewportWidth,
          gutter: GUTTER,
        });
        expect(left).toBe(GUTTER);
      });

      it(`vw=${viewportWidth}, panel=${panelWidth}: trigger at viewport-right → clamp to vw - panel - gutter`, () => {
        const left = clampPanelLeft({
          triggerLeft: viewportWidth - 80,
          triggerWidth: 80,
          panelWidth,
          viewportWidth,
          gutter: GUTTER,
        });
        expect(left).toBe(viewportWidth - panelWidth - GUTTER);
      });

      it(`vw=${viewportWidth}, panel=${panelWidth}: trigger at viewport centre → unclamped ideal`, () => {
        const triggerLeft = viewportWidth / 2 - 40;
        const left = clampPanelLeft({
          triggerLeft,
          triggerWidth: 80,
          panelWidth,
          viewportWidth,
          gutter: GUTTER,
        });
        expect(left).toBe(viewportWidth / 2 - panelWidth / 2);
      });
    }
  }
});

describe("clampPanelLeft — degenerate inputs", () => {
  it("picks the gutter when the panel is wider than the viewport minus two gutters", () => {
    const left = clampPanelLeft({
      triggerLeft: 0,
      triggerWidth: 50,
      panelWidth: 1200,
      viewportWidth: 1000,
      gutter: GUTTER,
    });
    expect(left).toBe(GUTTER);
  });
});

describe("MegaMenu — component wiring: regression guards", () => {
  const src = readFileSync(resolve(__dirname, "..", "components/layout/MegaMenu.tsx"), "utf8");

  it("imports clampPanelLeft from the pure module", () => {
    expect(src).toContain('import { clampPanelLeft } from "@/lib/mega-menu-position"');
  });

  it("runs the clamp in a useLayoutEffect so it applies before paint", () => {
    expect(src).toMatch(/useLayoutEffect\(\(\) => \{[\s\S]+?clampPanelLeft/);
  });

  it("rebinds the resize listener in the same effect", () => {
    expect(src).toMatch(/window\.addEventListener\("resize", reposition\)/);
    expect(src).toMatch(/window\.removeEventListener\("resize", reposition\)/);
  });

  it("passes the viewport gutter constant through", () => {
    expect(src).toContain("VIEWPORT_GUTTER_PX");
  });

  /**
   * CRITICAL: this is the specific regression from the browser audit.
   *
   * Tailwind v4 maps `-translate-x-1/2` to the `translate` CSS property, not
   * `transform`. Setting only `transform: "none"` leaves `translate: -50% 0`
   * in effect, so the clamped left is further shifted by -panelWidth/2.
   * Both must be reset.
   */
  it("inline style neutralises BOTH `transform` AND `translate` so Tailwind v4's -translate-x-1/2 is fully overridden", () => {
    expect(src).toMatch(/transform:\s*"none"/);
    expect(src).toMatch(/translate:\s*"none"/);
    // Catch the previous incomplete pattern that only reset `transform`.
    expect(src).not.toMatch(
      /style=\{panelLeftPx != null \? \{\s*left:\s*`\$\{panelLeftPx\}px`,\s*transform:\s*"none"\s*\}\s*:\s*undefined\}/,
    );
  });

  it("applies the inline style only when panelLeftPx has been computed", () => {
    expect(src).toMatch(/style=\{\s*panelLeftPx != null\s*\?/);
    expect(src).toMatch(/:\s*undefined\s*\}/);
  });
});
