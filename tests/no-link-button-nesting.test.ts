/**
 * Repo-wide regression guard: no file in app/** or components/** may render
 * <Link>…<Button>…</Button>…</Link>. That pattern produces invalid <a><button>
 * HTML and makes the inner button a non-functional dead-click target.
 *
 * The fix is to use the LinkButton component in components/ui/LinkButton.tsx
 * for navigation CTAs that need button styling.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "..");
const SCAN_DIRS = ["app", "components"];
const SKIP_FILE_PATTERNS = [/LinkButton\.tsx$/];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      yield* walk(full);
    } else if (entry.endsWith(".tsx")) {
      yield full;
    }
  }
}

function containsLinkWrappingButton(src: string): boolean {
  // Flatten whitespace so multi-line patterns are easy to grep.
  const flat = src.replace(/\s+/g, " ");
  // Non-greedy match the <Link ... > open tag through the next </Link>, require
  // a <Button appears strictly inside.
  const re = /<Link\b[^>]*>(?:(?!<\/Link>).)*?<Button\b[^>]*>/;
  return re.test(flat);
}

describe("no <Link> wrapping <Button> (invalid a>button)", () => {
  it("every .tsx under app/ and components/ is clean", () => {
    const offenders: string[] = [];
    for (const base of SCAN_DIRS) {
      const abs = resolve(ROOT, base);
      for (const file of walk(abs)) {
        if (SKIP_FILE_PATTERNS.some((p) => p.test(file))) continue;
        const src = readFileSync(file, "utf8");
        if (containsLinkWrappingButton(src)) offenders.push(file.replace(ROOT + "/", ""));
      }
    }
    expect(offenders, `Found Link>Button nesting in:\n${offenders.join("\n")}\nUse LinkButton from components/ui/LinkButton.tsx instead.`).toEqual([]);
  });
});
