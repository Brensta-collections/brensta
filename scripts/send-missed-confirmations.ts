/**
 * Operator one-off: send order confirmation emails for orders that were
 * placed BEFORE the email system went live. Reads order numbers from the
 * command line and fires the same confirmation email the live site now
 * sends automatically.
 *
 * Usage:
 *   pnpm tsx --env-file=.env --env-file=.env.local scripts/send-missed-confirmations.ts BRN-2026-000001 BRN-2026-000002
 */
import { sendOrderConfirmation } from "../lib/order-emails";

async function main() {
  const numbers = process.argv.slice(2).filter((s) => /^BRN-\d{4}-\d{6}$/.test(s));
  if (numbers.length === 0) {
    console.error("usage: pnpm tsx scripts/send-missed-confirmations.ts <BRN-YYYY-NNNNNN> [more...]");
    process.exit(2);
  }

  for (const n of numbers) {
    console.log(`→ sending confirmation for ${n}`);
    try {
      await sendOrderConfirmation(n);
      console.log(`  done ${n}`);
    } catch (e) {
      console.error(`  failed ${n}:`, e instanceof Error ? e.message : e);
    }
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
