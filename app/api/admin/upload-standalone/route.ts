import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin/rbac";
import { storage } from "@/lib/admin/storage";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Standalone image upload used by the admin CategoryForm (and anywhere else
 * that needs an image URL without an owning DB row). Writes to R2 (or local
 * disk in dev) via the shared storage driver and returns the public URL —
 * does not persist anything to the DB. Admin-only. Rate-limited.
 *
 * Form fields:
 *   file   = binary (JPG/PNG/WEBP/GIF, under UPLOAD_MAX_MB)
 *   prefix = optional, e.g. "cat" | "banner" | "misc" (default: "misc")
 */
export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const ip = ipFromRequest(req);
  const rl = rateLimit(`upload-standalone:${ip}`, 60, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid multipart body." }, { status: 400 });
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "misc").replace(/[^a-z0-9-]/gi, "") || "misc";
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required." }, { status: 400 });
  }
  const r = await storage().save(file, prefix);
  if (!r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({ ok: true, url: r.url, path: r.path, size: r.size, mime: r.mime });
}
