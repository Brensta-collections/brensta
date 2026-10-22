/**
 * Group F regression guard: an already signed-in visitor who lands on /login
 * must be redirected away (to the sanitized ?next, defaulting to /account).
 *
 * Verifies the source-level wiring. Full browser verification (actual session
 * cookie, actual redirect in a running build) is listed in the commit
 * message's browser-check section.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");

describe("/login page redirects signed-in users", () => {
  const src = read("app/(auth)/login/page.tsx");

  it("imports auth() and the server-side redirect helper", () => {
    expect(src).toContain('import { auth } from "@/auth"');
    expect(src).toContain('import { redirect } from "next/navigation"');
  });

  it("calls auth() during render and redirects when a user session exists", () => {
    expect(src).toMatch(/const session = await auth\(\);/);
    expect(src).toMatch(/if \(session\?\.user\) redirect\(nextPath\);/);
  });

  it("still sanitizes the next param via sanitizeAccountNext", () => {
    expect(src).toMatch(/const nextPath = sanitizeAccountNext\(rawNext\);/);
  });

  it("redirects *before* preparing the register href / Google button, so no form render for signed-in users", () => {
    // The redirect must appear in the source before registerHref / googleEnabled
    // are read; otherwise a server crash downstream could leak the form.
    const redirectIdx = src.search(/if \(session\?\.user\) redirect\(nextPath\);/);
    const registerIdx = src.search(/const registerHref/);
    const googleIdx = src.search(/const googleEnabled/);
    expect(redirectIdx).toBeGreaterThan(0);
    expect(registerIdx).toBeGreaterThan(redirectIdx);
    expect(googleIdx).toBeGreaterThan(redirectIdx);
  });
});

describe("Login + Register preserve intended return flows", () => {
  const login = read("app/(auth)/login/page.tsx");
  const register = read("app/(auth)/register/page.tsx");
  const loginForm = read("app/(auth)/login/LoginForm.tsx");

  it("login and register pages still forward ?next through to the sibling form", () => {
    expect(login).toMatch(/registerHref = `\/register\?next=\$\{encodeURIComponent\(nextPath\)\}`/);
    expect(register).toMatch(/loginHref = `\/login\?next=\$\{encodeURIComponent\(nextPath\)\}`/);
  });

  it("LoginForm uses sanitizeAccountNext for both credentials router.push and Google callbackUrl", () => {
    expect(loginForm).toMatch(/sanitizeAccountNext\(params\.get\("next"\)\)/);
    expect(loginForm).toMatch(/router\.push\(nextPath\);/);
    expect(loginForm).toMatch(/callbackUrl: nextPath/);
  });

  it("logout, forgot-password and reset-password are not touched", () => {
    const logout = read("app/(auth)/logout/route.ts");
    const forgot = read("app/(auth)/forgot-password/page.tsx");
    const reset = read("app/(auth)/reset-password/page.tsx");
    for (const src of [logout, forgot, reset]) {
      // None of these should have been changed to call auth() for a redirect;
      // they must remain reachable while signed in (logout) or while signed
      // out (password reset).
      expect(src).not.toContain('if (session?.user) redirect(nextPath)');
    }
  });
});
