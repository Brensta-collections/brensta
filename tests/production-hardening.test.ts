/**
 * Structural guards for the "code-only production preparation" phase.
 *
 * These are static reads of the source files — no server, no DB, no Next
 * runtime. They exist so a future refactor cannot silently delete the
 * security headers, the health probe, the branded error page, or the
 * backup scripts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("next.config.ts — security headers", () => {
  const src = read("next.config.ts");

  it("exports a headers() function that applies to every path", () => {
    expect(src).toMatch(/async headers\(\)/);
    expect(src).toMatch(/source:\s*"\/:path\*"/);
  });

  it("declares the baseline header set", () => {
    expect(src).toMatch(/X-Content-Type-Options/);
    expect(src).toMatch(/nosniff/);
    expect(src).toMatch(/X-Frame-Options/);
    expect(src).toMatch(/DENY/);
    expect(src).toMatch(/Referrer-Policy/);
    expect(src).toMatch(/strict-origin-when-cross-origin/);
    expect(src).toMatch(/Permissions-Policy/);
    expect(src).toMatch(/camera=\(\)/);
    expect(src).toMatch(/microphone=\(\)/);
    expect(src).toMatch(/geolocation=\(\)/);
  });

  it("emits HSTS only in production (behind a NODE_ENV check)", () => {
    expect(src).toMatch(/NODE_ENV === "production"[\s\S]{0,200}Strict-Transport-Security/);
    expect(src).toMatch(/max-age=31536000/);
    expect(src).toMatch(/includeSubDomains/);
  });

  it("does NOT ship a `preload` HSTS flag (we are not on the HSTS preload list)", () => {
    // Only inspect the emitted header value, not surrounding comments.
    const hstsLine = src.match(/Strict-Transport-Security"?\s*,\s*value:\s*"([^"]+)"/);
    expect(hstsLine).not.toBeNull();
    expect(hstsLine![1]).not.toMatch(/preload/);
  });

  it("preserves the pre-existing jewellery redirect — regression guard", () => {
    expect(src).toMatch(/\/c\/jewellery\/jhumkas/);
    expect(src).toMatch(/\/c\/jewellery\/earrings\/jhumka/);
  });
});

describe("health endpoint — app/api/health/route.ts", () => {
  const src = read("app/api/health/route.ts");

  it("exports a GET handler with a Node runtime hint", () => {
    expect(src).toMatch(/export async function GET\(/);
    expect(src).toMatch(/runtime\s*=\s*"nodejs"/);
    expect(src).toMatch(/dynamic\s*=\s*"force-dynamic"/);
  });

  it("returns a tiny JSON payload with uptime, time, and service name", () => {
    expect(src).toMatch(/service:\s*"brensta"/);
    expect(src).toMatch(/uptimeSec/);
    expect(src).toMatch(/toISOString\(\)/);
  });

  it("sets Cache-Control: no-store so the probe is never cached", () => {
    expect(src).toMatch(/Cache-Control.*no-store/);
  });

  it("does NOT touch the database — liveness only, not readiness", () => {
    expect(src).not.toMatch(/prisma\./);
    expect(src).not.toMatch(/from\s+["']@\/lib\/db["']/);
  });
});

describe("branded error boundary — app/error.tsx", () => {
  const src = read("app/error.tsx");

  it("is a client component (Next.js convention for error.tsx)", () => {
    expect(src.slice(0, 50)).toMatch(/"use client"/);
  });

  it("takes {error, reset} and surfaces the error digest to the console", () => {
    expect(src).toMatch(/\{\s*error,\s*reset,?\s*\}/);
    expect(src).toMatch(/error\.digest/);
    expect(src).toMatch(/console\.error/);
  });

  it("exposes a user-visible 'Try again' control wired to reset()", () => {
    expect(src).toMatch(/Try again/);
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*reset\(\)\}/);
  });

  it("offers a safe route back to home", () => {
    expect(src).toMatch(/href="\/"/);
    expect(src).toMatch(/Back to home/);
  });
});

describe("backup scripts — scripts/backup-*.sh", () => {
  const db = read("scripts/backup-db.sh");
  const up = read("scripts/backup-uploads.sh");

  it("both scripts refuse unknown environments (set -Eeuo pipefail)", () => {
    expect(db).toMatch(/set -Eeuo pipefail/);
    expect(up).toMatch(/set -Eeuo pipefail/);
  });

  it("db backup refuses to run when DATABASE_URL is unset", () => {
    expect(db).toMatch(/DATABASE_URL/);
    expect(db).toMatch(/refusing to proceed/i);
  });

  it("db backup is read-only against the database (pg_dump only, no destructive psql)", () => {
    expect(db).toMatch(/pg_dump/);
    // Must never issue destructive SQL from the backup path.
    expect(db).not.toMatch(/\bDROP\s+(DATABASE|TABLE|SCHEMA)/i);
    expect(db).not.toMatch(/\bTRUNCATE\b/i);
    expect(db).not.toMatch(/\bpsql\b.+-c\b.*DROP/i);
  });

  it("db backup writes to a dedicated backups/ dir and cleans partial files on failure", () => {
    expect(db).toMatch(/backups/);
    expect(db).toMatch(/\.partial/);
    expect(db).toMatch(/trap cleanup EXIT/);
  });

  it("uploads backup never deletes the source — only tar + gzip + prune", () => {
    expect(up).toMatch(/public\/uploads/);
    expect(up).toMatch(/tar/);
    expect(up).not.toMatch(/rm -rf (?:\$|\/)/);
    expect(up).not.toMatch(/\brsync\s[^|]*--delete/);
  });

  it("both scripts self-prune (retention policy, non-fatal if nothing to drop)", () => {
    expect(db).toMatch(/find.+-name 'db-\*\.sql\.gz'/);
    expect(up).toMatch(/find.+-name 'uploads-\*\.tar\.gz'/);
  });

  it("files are executable (chmod +x)", () => {
    const dbMode = statSync(resolve(__dirname, "..", "scripts/backup-db.sh")).mode;
    const upMode = statSync(resolve(__dirname, "..", "scripts/backup-uploads.sh")).mode;
    // Owner execute bit set.
    expect(dbMode & 0o100).toBe(0o100);
    expect(upMode & 0o100).toBe(0o100);
  });
});

describe("deployment documentation — DEPLOY.md", () => {
  const src = read("DEPLOY.md");

  it("names Ubuntu 24.04 ARM, Caddy, and Neon as the target stack", () => {
    expect(src).toMatch(/Ubuntu 24\.04/);
    expect(src).toMatch(/ARM/);
    expect(src).toMatch(/Caddy/);
    expect(src).toMatch(/Neon/i);
  });

  it("documents the production-required env vars", () => {
    expect(src).toMatch(/DATABASE_URL/);
    expect(src).toMatch(/AUTH_SECRET/);
    expect(src).toMatch(/AUTH_URL/);
    expect(src).toMatch(/NEXT_PUBLIC_SITE_URL/);
  });

  it("tells the operator to use `prisma migrate deploy` — not `migrate dev` — in production", () => {
    expect(src).toMatch(/prisma migrate deploy/);
    expect(src).not.toMatch(/prisma migrate dev\b/);
  });

  it("flags online payments and guest checkout as NOT ready", () => {
    expect(src).toMatch(/COD only/i);
    expect(src).toMatch(/Guest checkout/i);
    expect(src).toMatch(/stub/i);
  });

  it("warns that BOOTSTRAP_ADMIN_* must be removed after first admin", () => {
    expect(src).toMatch(/BOOTSTRAP_ADMIN/);
    expect(src).toMatch(/rotate|rotated|unset|remove/i);
  });
});

describe(".gitignore — backups directory is excluded", () => {
  const src = read(".gitignore");
  it("ignores /backups so cron output never ends up staged", () => {
    expect(src).toMatch(/^\/backups$/m);
  });
});
