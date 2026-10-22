/**
 * Group H: repo-wide RBAC guard — every page under app/(admin)/admin must
 * call requireAdmin() or assertAdmin() somewhere in its source. Catches a
 * future contributor forgetting the layer-3 check (defense in depth —
 * middleware + layout + page). The admin layout also calls requireAdmin(),
 * so this is belt-and-braces, not the only barrier.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "..");
const ADMIN_ROOT = resolve(ROOT, "app/(admin)/admin");

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (entry === "page.tsx") yield full;
  }
}

describe("admin page RBAC coverage", () => {
  it("every admin page.tsx calls requireAdmin() or assertAdmin()", () => {
    const offenders: string[] = [];
    for (const file of walk(ADMIN_ROOT)) {
      const src = readFileSync(file, "utf8");
      if (!/\b(requireAdmin|assertAdmin)\s*\(/.test(src)) {
        offenders.push(file.replace(ROOT + "/", ""));
      }
    }
    expect(offenders, `Admin pages missing an in-page RBAC call:\n${offenders.join("\n")}`).toEqual([]);
  });
});
