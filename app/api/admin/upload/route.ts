import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin/rbac";
import { addProductImage } from "@/lib/admin/products";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

/**
 * Multipart upload for product images. Admin only.
 * Form fields: productId=<cuid>, file=<binary>
 */
export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const ip = ipFromRequest(req);
  const rl = rateLimit(`upload:${ip}`, 60, 60); // 60 uploads/min per IP
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many uploads." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid multipart body." }, { status: 400 });
  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");
  if (!productId || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "productId and file are required." }, { status: 400 });
  }
  const r = await addProductImage(productId, file);
  if (!r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json(r);
}
