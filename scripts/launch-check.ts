/**
 * Pre-deploy readiness report.
 *
 * Prints:
 *   1. Env validation report (errors + warnings)
 *   2. Count of [PLACEHOLDER] markers remaining in policy drafts
 *   3. A reminder of items that still require the business owner's
 *      explicit sign-off before customer traffic.
 *
 * Exits non-zero if `validateEnv` returned any hard error, so this can be
 * wired into a CI gate without extra plumbing.
 *
 * Usage:  pnpm tsx scripts/launch-check.ts
 *         NODE_ENV=production pnpm tsx scripts/launch-check.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateEnv } from "../lib/env";

const ROOT = resolve(__dirname, "..");

function countPlaceholders(): number {
  const src = readFileSync(resolve(ROOT, "lib/policies.ts"), "utf8");
  return (src.match(/\[PLACEHOLDER/g) ?? []).length;
}

function hr() {
  console.log("─".repeat(60));
}

const report = validateEnv(process.env);

console.log("");
hr();
console.log(`BRENSTA launch check — mode: ${report.mode}`);
hr();

if (report.errors.length === 0) {
  console.log("✓ env: no hard failures");
} else {
  console.log("✗ env errors (must fix before deploy):");
  for (const e of report.errors) console.log(`  - ${e}`);
}

if (report.warnings.length > 0) {
  console.log("");
  console.log("! env warnings:");
  for (const w of report.warnings) console.log(`  - ${w}`);
}

console.log("");
const placeholders = countPlaceholders();
console.log(`policies: ${placeholders} [PLACEHOLDER] markers still in lib/policies.ts`);

console.log("");
console.log("owner decisions still pending (see Group G report for the full list):");
console.log("  - legal entity name, registered address, GSTIN");
console.log("  - jurisdiction for Terms disputes");
console.log("  - grievance officer name + acknowledgement/resolution SLAs");
console.log("  - courier partners + dispatch/delivery windows");
console.log("  - return window and refund SLA");
console.log("  - whether +91 93097 01804 is WhatsApp-enabled");
console.log("");

if (!report.ok) process.exit(1);
