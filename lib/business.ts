/**
 * Owner-confirmed, authoritative business contact facts.
 *
 * Legal entity is a sole proprietorship. The proprietor's name appears ONLY
 * in the Privacy, Terms and Grievance pages, where the Consumer Protection
 * (E-Commerce) Rules 2020 require identifying the operating entity. Nowhere
 * else — the storefront presents the "BRENSTA" brand to customers.
 */
export const BUSINESS_EMAIL = "brensta.business@gmail.com";

// Human-readable phone, as it should appear in the UI.
export const BUSINESS_PHONE_DISPLAY = "+91 93097 01804";
// Dial-safe phone, for `href="tel:…"`.
export const BUSINESS_PHONE_TEL = "+919309701804";

/** Legal operating entity — used only on legally-required disclosure pages. */
export const LEGAL_ENTITY_NAME = "Jayshree Shreekrushna Katkade (Sole Proprietor, trading as BRENSTA)";

/** Registered business address — used on policy pages. */
export const LEGAL_ADDRESS =
  "Gat No. 286, Havaldar Vasti, Near Swami Samarth Mandir, Moshi, Pune, Maharashtra — 412105, India";

/** Grievance Officer — statutory role under CPA 2019 + E-Commerce Rules 2020. */
export const GRIEVANCE_OFFICER = {
  // Sole proprietor is the grievance officer by default for a sole prop.
  name: "Jayshree Shreekrushna Katkade",
  email: BUSINESS_EMAIL,
  phone: BUSINESS_PHONE_DISPLAY,
};

/** Dispute jurisdiction — where any court case related to orders is heard. */
export const DISPUTE_JURISDICTION = "Pune, Maharashtra, India";

/**
 * Returns true if a stored Setting value is still a seed-time stub (empty,
 * obviously-unset email, phone starting 00000, or still contains the
 * `[PLACEHOLDER]` marker from a draft policy body).
 */
export function isPlaceholderContact(v: string | null | undefined): boolean {
  if (!v) return true;
  if (/\[PLACEHOLDER/i.test(v)) return true;
  if (/^\+?91-?0{3,}/.test(v)) return true;
  if (/@brensta\.local$/i.test(v)) return true;
  return false;
}
