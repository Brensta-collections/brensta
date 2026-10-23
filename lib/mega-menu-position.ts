/**
 * Pure positioning math for the storefront mega-menu panel.
 *
 * The panel is anchored on a trigger near the top of the viewport. The old
 * implementation used `left-1/2 -translate-x-1/2` which centres the panel
 * on the trigger — fine when the trigger is near the viewport centre,
 * broken for triggers near either edge. At 1280px the Jewellery trigger
 * (first category) sits ~x=320, so a 720px panel centred there starts at
 * ~x=-40 and clips the left edge.
 *
 * `clampPanelLeft` returns the panel's viewport-relative `left` coordinate
 * so that:
 *   • left  >= gutter
 *   • right <= viewportWidth - gutter
 *   • panel stays as close to the trigger centre as those constraints allow
 *
 * No DOM, no side effects — the caller is responsible for measuring and
 * for converting the result into a parent-relative inline style.
 */
export type ClampArgs = {
  /** Trigger's left edge in viewport coordinates (CSS px). */
  triggerLeft: number;
  /** Trigger's width in CSS px. */
  triggerWidth: number;
  /** Panel's offsetWidth in CSS px. */
  panelWidth: number;
  /** window.innerWidth in CSS px. */
  viewportWidth: number;
  /** Minimum gap between the panel's edges and the viewport edges. */
  gutter: number;
};

export function clampPanelLeft(args: ClampArgs): number {
  const { triggerLeft, triggerWidth, panelWidth, viewportWidth, gutter } = args;
  const triggerCenter = triggerLeft + triggerWidth / 2;
  const idealLeft = triggerCenter - panelWidth / 2;

  // If the panel is wider than the viewport minus two gutters, we can't
  // satisfy both edges — prefer flush-left so the panel's own content starts
  // at a visible column rather than the heading being cut off.
  const maxLeft = viewportWidth - panelWidth - gutter;
  if (maxLeft < gutter) return gutter;

  return Math.max(gutter, Math.min(idealLeft, maxLeft));
}
