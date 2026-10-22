/**
 * Launch-readiness env validator.
 *
 * This is a PURE function — importing this module has zero side effects, so
 * it is safe for dev, tests and CI. The intended callers are:
 *   - scripts/launch-check.ts (CLI used before deploy)
 *   - a future /api/_health route if we add one
 *
 * We deliberately do NOT throw at module load: that would turn a missing
 * optional var into a build-crash, and the error window the owner sees
 * during initial setup should be a readable report rather than a stack
 * trace from an import chain.
 */
import { z } from "zod";

// ── Shared shapes ────────────────────────────────────────────────────────
const urlStr = z.string().url();
const nonEmpty = z.string().min(1);
const boolStr = z.enum(["true", "false"]);

// ── Env schema ───────────────────────────────────────────────────────────
// `required` applies in production; `optional` in all modes. The runtime
// contract: `validateEnv()` reads `NODE_ENV` to decide which rules apply.
const prodRequired = z.object({
  // Database
  DATABASE_URL: nonEmpty,
  // NextAuth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: urlStr,
  // Site
  NEXT_PUBLIC_SITE_URL: urlStr.refine((v) => !v.includes("localhost"), {
    message: "NEXT_PUBLIC_SITE_URL must not be localhost in production",
  }),
});

const alwaysOptional = z.object({
  // Google OAuth (either both set or both empty)
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  // Razorpay (sandbox or live)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  // Toggles
  COD_ENABLED: boolStr.optional(),
});

export type EnvReport = {
  ok: boolean;
  mode: "development" | "test" | "production";
  errors: string[];   // hard failures that must be fixed before deploy
  warnings: string[]; // optional / missing-in-dev issues worth seeing
};

/**
 * Validate a snapshot of environment variables and return a structured
 * report. Pass `process.env` from a CLI or endpoint — kept as an argument
 * so tests can supply synthetic snapshots deterministically.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const mode: EnvReport["mode"] =
    env.NODE_ENV === "production" ? "production"
    : env.NODE_ENV === "test" ? "test"
    : "development";

  const errors: string[] = [];
  const warnings: string[] = [];

  if (mode === "production") {
    const r = prodRequired.safeParse(env);
    if (!r.success) {
      for (const i of r.error.issues) {
        errors.push(`${i.path.join(".") || "env"}: ${i.message}`);
      }
    }
  } else {
    // In dev we only warn about missing production-required vars so the
    // developer sees what still needs setting up before launch.
    for (const key of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "NEXT_PUBLIC_SITE_URL"] as const) {
      if (!env[key]) warnings.push(`${key} is not set (required before production launch)`);
    }
  }

  // Optional pairings — if one side is set, the other must be too.
  if (!!env.AUTH_GOOGLE_ID !== !!env.AUTH_GOOGLE_SECRET) {
    errors.push("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must both be set or both be empty");
  }
  if (!!env.RAZORPAY_KEY_ID !== !!env.RAZORPAY_KEY_SECRET) {
    errors.push("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must both be set or both be empty");
  }

  // Shape checks for present-but-malformed values.
  const shape = alwaysOptional.safeParse(env);
  if (!shape.success) {
    for (const i of shape.error.issues) {
      errors.push(`${i.path.join(".") || "env"}: ${i.message}`);
    }
  }

  // Soft reminders — items that are safe to ship without, but the owner
  // will want these set before customers hit the site in anger.
  if (mode === "production") {
    if (!env.RESEND_API_KEY) {
      warnings.push("RESEND_API_KEY is not set — password reset emails will fall back to the console provider");
    }
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      warnings.push("Razorpay keys are not set — online payment is still disabled; COD only");
    }
    if (!env.AUTH_GOOGLE_ID || !env.AUTH_GOOGLE_SECRET) {
      warnings.push("Google OAuth is not configured — email + password is the only sign-in method");
    }
  }

  return { ok: errors.length === 0, mode, errors, warnings };
}
