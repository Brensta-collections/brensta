/**
 * Owner-supplied, authoritative business contact facts. These are the
 * fallbacks used across the storefront and policy pages when the DB-backed
 * admin `Setting` rows still carry seeded placeholders. The admin can override
 * them from /admin/settings; this file is NOT what the storefront reads
 * directly — the storefront always queries the DB first, then falls back to
 * these constants.
 *
 * Do NOT add a registered address, GSTIN, WhatsApp number, courier SLAs,
 * refund windows or company name here — none of those have been confirmed by
 * the owner. Those stay in the policy drafts as explicit [PLACEHOLDER]
 * markers so legal + ops can finalise them before launch.
 */
export const BUSINESS_EMAIL = "brensta.business@gmail.com";

// Human-readable phone, as it should appear in the UI.
export const BUSINESS_PHONE_DISPLAY = "+91 93097 01804";
// Dial-safe phone, for `href="tel:…"`.
export const BUSINESS_PHONE_TEL = "+919309701804";

/**
 * Returns true if a stored Setting value is still a placeholder, empty, or
 * one of the obviously-unset seed values (@brensta.local emails, phone
 * numbers starting with 00000, bracketed [PLACEHOLDER] markers).
 */
export function isPlaceholderContact(v: string | null | undefined): boolean {
  if (!v) return true;
  if (/\[PLACEHOLDER/i.test(v)) return true;
  if (/^\+?91-?0{3,}/.test(v)) return true;
  if (/@brensta\.local$/i.test(v)) return true;
  return false;
}
