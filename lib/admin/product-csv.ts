"use server";

import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { parseCsv, toCsv } from "@/lib/admin/csv";
import { slugify } from "@/lib/utils";

export type ImportPreviewRow = {
  line: number;
  action: "create" | "update" | "skip" | "error";
  message?: string;
  slug?: string;
  name?: string;
  sku?: string;
  basePrice?: number;
  categoryPath?: string;
  stock?: number;
};

const REQUIRED_HEADERS = ["name", "slug", "sku", "category_path", "base_price", "stock"];

export async function previewProductCsv(csvText: string): Promise<{ ok: true; rows: ImportPreviewRow[] } | { ok: false; error: string }> {
  await assertAdmin();
  const data = parseCsv(csvText);
  if (data.length === 0) return { ok: false, error: "CSV is empty." };
  const headers = Object.keys(data[0]);
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) return { ok: false, error: `Missing columns: ${missing.join(", ")}` };

  const rows: ImportPreviewRow[] = [];
  const seenSKUs = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const line = i + 2; // header + 1-based
    const name = (r.name ?? "").trim();
    const slug = ((r.slug ?? "").trim() || slugify(name));
    const sku = (r.sku ?? "").trim().toUpperCase();
    const basePrice = Number(r.base_price);
    const stock = Number(r.stock || 0);
    const categoryPath = (r.category_path ?? "").trim();

    if (!name) { rows.push({ line, action: "error", message: "Missing name." }); continue; }
    if (!sku) { rows.push({ line, action: "error", message: "Missing SKU." }); continue; }
    if (seenSKUs.has(sku)) { rows.push({ line, action: "error", message: `Duplicate SKU "${sku}" in file.` }); continue; }
    seenSKUs.add(sku);
    if (!Number.isFinite(basePrice) || basePrice <= 0) { rows.push({ line, action: "error", message: "Invalid base_price." }); continue; }
    if (!categoryPath.startsWith("/")) { rows.push({ line, action: "error", message: "category_path must start with /" }); continue; }

    const category = await prisma.category.findUnique({ where: { path: categoryPath }, select: { id: true } });
    if (!category) { rows.push({ line, action: "error", message: `Unknown category_path "${categoryPath}"` }); continue; }

    const existingBySku = await prisma.productVariant.findUnique({ where: { sku }, select: { productId: true } });
    const existingBySlug = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (existingBySku && existingBySlug && existingBySku.productId !== existingBySlug.id) {
      rows.push({ line, action: "error", message: `SKU belongs to a different product than slug.` });
      continue;
    }
    rows.push({
      line,
      action: existingBySlug ? "update" : "create",
      name,
      slug,
      sku,
      basePrice,
      categoryPath,
      stock,
    });
  }
  return { ok: true, rows };
}

export async function applyProductCsv(csvText: string): Promise<{ ok: true; created: number; updated: number; skipped: number } | { ok: false; error: string }> {
  const admin = await assertAdmin();
  const preview = await previewProductCsv(csvText);
  if (!preview.ok) return preview;
  let created = 0, updated = 0, skipped = 0;

  for (const r of preview.rows) {
    if (r.action === "error" || r.action === "skip") { skipped++; continue; }
    const category = await prisma.category.findUnique({ where: { path: r.categoryPath! }, select: { id: true } });
    if (!category) { skipped++; continue; }
    if (r.action === "create") {
      const product = await prisma.$transaction(async (tx) => {
        const p = await tx.product.create({
          data: {
            name: r.name!,
            slug: r.slug!,
            basePrice: r.basePrice!,
            status: "DRAFT",
            createdById: admin.id,
          },
        });
        await tx.productCategory.create({ data: { productId: p.id, categoryId: category.id, isPrimary: true } });
        const v = await tx.productVariant.create({
          data: {
            productId: p.id,
            sku: r.sku!,
            price: r.basePrice!,
            stock: r.stock ?? 0,
            optionValues: { Default: "default" },
            isActive: true,
          },
        });
        if ((r.stock ?? 0) > 0) {
          await tx.stockLedger.create({ data: { variantId: v.id, delta: r.stock!, reason: "initial", userId: admin.id, note: "CSV import" } });
        }
        return p;
      });
      void product;
      created++;
    } else if (r.action === "update") {
      const existing = await prisma.product.findUnique({ where: { slug: r.slug! }, include: { variants: true } });
      if (!existing) { skipped++; continue; }
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: existing.id },
          data: { name: r.name!, basePrice: r.basePrice! },
        });
        const variant = existing.variants.find((v) => v.sku === r.sku);
        if (variant) {
          const delta = (r.stock ?? 0) - variant.stock;
          await tx.productVariant.update({ where: { id: variant.id }, data: { stock: r.stock! } });
          if (delta !== 0) {
            await tx.stockLedger.create({ data: { variantId: variant.id, delta, reason: "adjustment", userId: admin.id, note: "CSV import update" } });
          }
        }
      });
      updated++;
    }
  }
  await recordAudit({ action: "product.csv.import", entityType: "Product", after: { created, updated, skipped } });
  return { ok: true, created, updated, skipped };
}

export async function exportProductsCsv(): Promise<string> {
  await assertAdmin();
  const rows = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      variants: { select: { sku: true, stock: true, price: true } },
      categories: { include: { category: { select: { path: true } } }, take: 1 },
    },
  });
  const out: Record<string, string | number | null>[] = [];
  for (const p of rows) {
    const primary = p.categories[0]?.category.path ?? "";
    for (const v of p.variants) {
      out.push({
        name: p.name,
        slug: p.slug,
        sku: v.sku,
        category_path: primary,
        base_price: Number(p.basePrice),
        price: Number(v.price),
        stock: v.stock,
        status: p.status,
      });
    }
  }
  await recordAudit({ action: "product.csv.export", entityType: "Product", after: { rows: out.length } });
  return toCsv(out);
}
