/**
 * Group H: env readiness report. Pure function — tested with synthetic
 * NodeJS.ProcessEnv snapshots.
 */
import { describe, it, expect } from "vitest";
import { validateEnv } from "@/lib/env";

function make(partial: Record<string, string | undefined>, mode: "development" | "test" | "production" = "development"): NodeJS.ProcessEnv {
  return { NODE_ENV: mode, ...partial } as NodeJS.ProcessEnv;
}

describe("validateEnv — production required fields", () => {
  it("fails loudly when every required var is missing", () => {
    const r = validateEnv(make({}, "production"));
    expect(r.ok).toBe(false);
    expect(r.mode).toBe("production");
    expect(r.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
    expect(r.errors.some((e) => e.includes("AUTH_SECRET"))).toBe(true);
    expect(r.errors.some((e) => e.includes("AUTH_URL"))).toBe(true);
    expect(r.errors.some((e) => e.includes("NEXT_PUBLIC_SITE_URL"))).toBe(true);
  });

  it("requires AUTH_SECRET to be at least 32 characters", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://x",
      AUTH_SECRET: "short",
      AUTH_URL: "https://brensta.com",
      NEXT_PUBLIC_SITE_URL: "https://brensta.com",
    }, "production"));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /AUTH_SECRET.*32/i.test(e))).toBe(true);
  });

  it("rejects a localhost NEXT_PUBLIC_SITE_URL in production", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://x",
      AUTH_SECRET: "x".repeat(32),
      AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    }, "production"));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("localhost"))).toBe(true);
  });

  it("passes with a well-formed production env", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://u:p@host/db",
      AUTH_SECRET: "a".repeat(40),
      AUTH_URL: "https://brensta.com",
      NEXT_PUBLIC_SITE_URL: "https://brensta.com",
    }, "production"));
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });
});

describe("validateEnv — optional pairings", () => {
  it("flags one-sided Google OAuth config", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://x",
      AUTH_SECRET: "a".repeat(40),
      AUTH_URL: "https://brensta.com",
      NEXT_PUBLIC_SITE_URL: "https://brensta.com",
      AUTH_GOOGLE_ID: "id-only",
    }, "production"));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET"))).toBe(true);
  });

  it("flags one-sided Razorpay config", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://x",
      AUTH_SECRET: "a".repeat(40),
      AUTH_URL: "https://brensta.com",
      NEXT_PUBLIC_SITE_URL: "https://brensta.com",
      RAZORPAY_KEY_SECRET: "secret-only",
    }, "production"));
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"))).toBe(true);
  });

  it("accepts both halves of each pair empty", () => {
    const r = validateEnv(make({
      DATABASE_URL: "postgresql://x",
      AUTH_SECRET: "a".repeat(40),
      AUTH_URL: "https://brensta.com",
      NEXT_PUBLIC_SITE_URL: "https://brensta.com",
    }, "production"));
    expect(r.ok).toBe(true);
  });
});

describe("validateEnv — development mode", () => {
  it("is non-strict in development but still reports warnings for missing prod vars", () => {
    const r = validateEnv(make({}, "development"));
    expect(r.ok).toBe(true);
    expect(r.mode).toBe("development");
    expect(r.warnings.some((w) => w.includes("DATABASE_URL"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("AUTH_SECRET"))).toBe(true);
  });
});

describe("validateEnv — production soft reminders", () => {
  const base = {
    DATABASE_URL: "postgresql://x",
    AUTH_SECRET: "a".repeat(40),
    AUTH_URL: "https://brensta.com",
    NEXT_PUBLIC_SITE_URL: "https://brensta.com",
  };
  it("warns when email + Razorpay + Google OAuth are all absent", () => {
    const r = validateEnv(make(base, "production"));
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.includes("RESEND_API_KEY"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("Razorpay"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("Google OAuth"))).toBe(true);
  });
});
