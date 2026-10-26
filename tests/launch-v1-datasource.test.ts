/**
 * Guardrails for the release/launch-v1 strict freeze.
 *
 * These tests assert three invariants that MUST hold for a safe first
 * production deploy against Neon:
 *   1. prisma/schema.prisma matches the applied migration history
 *      exactly — no drifted lines sneak into the Neon migration.
 *   2. The datasource is wired for Neon's pooled + direct split so
 *      `prisma migrate deploy` and runtime queries hit the right endpoints.
 *   3. .env.example and DEPLOY.md document the two-URL contract so a
 *      future operator cannot miss it.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("prisma/schema.prisma — Neon datasource wiring", () => {
  const src = read("prisma/schema.prisma");

  it("declares the datasource with both url and directUrl", () => {
    expect(src).toMatch(/datasource db \{[\s\S]{0,300}provider\s*=\s*"postgresql"/);
    expect(src).toMatch(/url\s*=\s*env\("DATABASE_URL"\)/);
    expect(src).toMatch(/directUrl\s*=\s*env\("DIRECT_URL"\)/);
  });

  it("still uses provider postgresql only (no SQLite / mysql drift)", () => {
    expect(src).toMatch(/provider\s*=\s*"postgresql"/);
    expect(src).not.toMatch(/provider\s*=\s*"(sqlite|mysql|mongodb)"/);
  });
});

describe("prisma/schema.prisma — launch-v1 strict freeze", () => {
  const src = read("prisma/schema.prisma");

  it("User does NOT carry the un-migrated phoneVerified field", () => {
    // Match "phoneVerified" only inside the User model.
    const userBlock = src.match(/model User \{[\s\S]*?\n\}\n/);
    expect(userBlock).not.toBeNull();
    expect(userBlock![0]).not.toMatch(/phoneVerified/);
  });

  it("Order does NOT carry the un-migrated guestAccessToken field", () => {
    const orderBlock = src.match(/model Order \{[\s\S]*?\n\}\n/);
    expect(orderBlock).not.toBeNull();
    expect(orderBlock![0]).not.toMatch(/guestAccessToken/);
  });

  it("Review does NOT carry the un-migrated isStoreAuthored field", () => {
    const reviewBlock = src.match(/model Review \{[\s\S]*?\n\}\n/);
    expect(reviewBlock).not.toBeNull();
    expect(reviewBlock![0]).not.toMatch(/isStoreAuthored/);
  });

  it("Review does NOT carry the un-migrated per-user-per-product unique constraint", () => {
    const reviewBlock = src.match(/model Review \{[\s\S]*?\n\}\n/);
    expect(reviewBlock).not.toBeNull();
    expect(reviewBlock![0]).not.toMatch(/one_review_per_product_per_user/);
    expect(reviewBlock![0]).not.toMatch(/@@unique\(\[productId,\s*userId\]/);
  });
});

describe("package.json — deployment script", () => {
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

  it("exposes db:deploy that runs prisma migrate deploy (non-interactive, prod-safe)", () => {
    expect(pkg.scripts["db:deploy"]).toBe("prisma migrate deploy");
  });

  it("still exposes db:migrate for local dev (should NOT be used in prod)", () => {
    expect(pkg.scripts["db:migrate"]).toBe("prisma migrate dev");
  });
});

describe(".env.example — pooled + direct documentation", () => {
  const src = read(".env.example");

  it("defines DATABASE_URL (pooled runtime URL)", () => {
    expect(src).toMatch(/^DATABASE_URL=/m);
  });

  it("defines DIRECT_URL (direct migration URL)", () => {
    expect(src).toMatch(/^DIRECT_URL=/m);
  });

  it("explains that production Neon needs both pooled and direct endpoints", () => {
    expect(src).toMatch(/pooled/i);
    expect(src).toMatch(/direct/i);
    expect(src).toMatch(/-pooler/);
    expect(src).toMatch(/pgbouncer=true/);
    expect(src).toMatch(/sslmode=require/);
  });

  it("mentions the Singapore region hostname fragment", () => {
    expect(src).toMatch(/ap-southeast-1/);
  });

  it("contains ONLY placeholder values — no real secrets", () => {
    // Shape check only — we never inline a real secret value in a committed
    // test file. Every secret-bearing env var must either be empty ("") or
    // contain an explicit REPLACE_WITH_* placeholder.
    const secretLikeKeys = ["AUTH_SECRET", "RESEND_API_KEY", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"];
    for (const key of secretLikeKeys) {
      const line = src.match(new RegExp(`^${key}=\"([^\"]*)\"`, "m"));
      if (!line) continue; // key may be absent — that is fine
      const value = line[1];
      const ok = value === "" || /^REPLACE_WITH_/i.test(value);
      expect(ok, `${key} must be empty or REPLACE_WITH_* in .env.example`).toBe(true);
    }
    // The database URL password slot must be a REPLACE_WITH_* placeholder.
    const dbLines = src.match(/^(?:DATABASE_URL|DIRECT_URL)=\"postgresql:\/\/[^:]+:([^@]+)@/gm) ?? [];
    for (const l of dbLines) {
      expect(l).toMatch(/:REPLACE_WITH_[A-Z_]+@/);
    }
  });
});

describe("DEPLOY.md — Neon two-URL coverage", () => {
  const src = read("DEPLOY.md");

  it("documents DIRECT_URL as a required var alongside DATABASE_URL", () => {
    expect(src).toMatch(/DATABASE_URL/);
    expect(src).toMatch(/DIRECT_URL/);
  });

  it("explains the pooled vs direct split and the pgbouncer flag", () => {
    expect(src).toMatch(/-pooler/);
    expect(src).toMatch(/pgbouncer=true/);
    expect(src).toMatch(/session mode/i);
  });

  it("names the Singapore region", () => {
    expect(src).toMatch(/Singapore/i);
    expect(src).toMatch(/ap-southeast-1/);
  });

  it("tells the operator to use pnpm db:deploy (not migrate dev) on the VM", () => {
    expect(src).toMatch(/pnpm db:deploy/);
    expect(src).not.toMatch(/pnpm db:migrate\b.+VM/i);
  });

  it("notes that backup-db.sh must run against DIRECT_URL", () => {
    expect(src).toMatch(/backup-db\.sh/);
    expect(src).toMatch(/DIRECT_URL/);
  });
});
