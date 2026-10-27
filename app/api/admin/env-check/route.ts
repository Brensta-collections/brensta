import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin-only diagnostic. Reports whether each production env var is present
 * and its length — NEVER the actual secret value. Used to debug cases where
 * Vercel's dashboard says a var is set but the serverless runtime does not
 * see it (e.g. after an env edit that pre-dated the current deploy).
 */
export async function GET() {
  await assertAdmin();

  const keys = [
    "DATABASE_URL",
    "DIRECT_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "NEXT_PUBLIC_SITE_URL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "EMAIL_DRIVER",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_BUCKET",
    "R2_PUBLIC_URL",
    "UPLOAD_DRIVER",
  ] as const;

  const report = Object.fromEntries(
    keys.map((k) => {
      const v = process.env[k];
      return [
        k,
        {
          present: typeof v === "string" && v.length > 0,
          length: v?.length ?? 0,
          // For NEXT_PUBLIC_ and config-only values, show a safe preview.
          preview:
            v && (k.startsWith("NEXT_PUBLIC_") || k === "EMAIL_FROM" || k === "AUTH_URL" || k === "UPLOAD_DRIVER" || k === "R2_BUCKET" || k === "R2_PUBLIC_URL" || k === "EMAIL_DRIVER")
              ? v
              : v
                ? v.slice(0, 4) + "..." + v.slice(-2)
                : null,
        },
      ];
    }),
  );

  return NextResponse.json(
    {
      ok: true,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
      time: new Date().toISOString(),
      env: report,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
