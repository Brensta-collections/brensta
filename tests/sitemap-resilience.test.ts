/**
 * Guards that `/sitemap.xml` cannot block a production deploy.
 *
 * The last Vercel build failed when Prisma threw during static generation
 * of /sitemap.xml because DATABASE_URL was invalid. These structural tests
 * make sure the two defensive measures stay in place.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("app/sitemap.ts — build-time resilience", () => {
  const src = read("app/sitemap.ts");

  it("opts out of static generation with dynamic = 'force-dynamic'", () => {
    expect(src).toMatch(/export const dynamic\s*=\s*"force-dynamic"/);
  });

  it("wraps the Prisma queries in try/catch so a DB failure does not throw", () => {
    expect(src).toMatch(/try\s*\{/);
    expect(src).toMatch(/\}\s*catch\s*\(err\)\s*\{/);
  });

  it("falls back to a static route list (home + shop + about + contact + policies) on DB failure", () => {
    // The catch branch must `return staticRoutes` — a bare throw would
    // defeat the whole point.
    expect(src).toMatch(/return staticRoutes/);
  });

  it("logs a clear console warning when the DB fallback kicks in", () => {
    expect(src).toMatch(/console\.warn\([^)]*sitemap/);
    expect(src).toMatch(/DB query failed/);
  });
});

describe("package.json — Vercel + Prisma plumbing", () => {
  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };

  it("runs prisma generate on postinstall so Vercel always builds against a fresh client", () => {
    expect(pkg.scripts.postinstall).toBe("prisma generate");
  });

  it("still exposes db:deploy for the operator to run prisma migrate deploy on the VM", () => {
    expect(pkg.scripts["db:deploy"]).toBe("prisma migrate deploy");
  });
});
