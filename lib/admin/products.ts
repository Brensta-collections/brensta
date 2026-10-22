"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertAdmin } from "@/lib/admin/rbac";
import { recordAudit } from "@/lib/admin/audit";
import { storage } from "@/lib/admin/storage";
import { productFormSchema, type ProductFormInput } from "@/lib/validators/product";
import type { Prisma, PublishStatus } from "@prisma/client";

const nz = <T,>(v: T | null | undefined) => (v === undefined ? null : v);

export async function listAdminProducts(opts: {
  q?: string;
  categoryId?: string;
  status?: PublishStatus | "ALL";
  stock?: "low" | "out" | "all";
  page?: number;
  perPage?: number;
}) {
  await assertAdmin();
  const where: Prisma.ProductWhereInput = {};
  if (opts.status && opts.status !== "ALL") where.status = opts.status;
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { slug: { contains: opts.q, mode: "insensitive" } },
      { variants: { some: { sku: { contains: opts.q, mode: "insensitive" } } } },
    ];
  }
  if (opts.categoryId) {
    where.categories = { some: { categoryId: opts.categoryId } };
  }
  if (opts.stock === "low") {
    where.variants = { some: { stock: { lte: 5, gt: 0 }, isActive: true } };
  } else if (opts.stock === "out") {
    where.variants = { every: { stock: 0 } };
  }
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(100, opts.perPage ?? 25);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { sortOrder: "asc" } },
        variants: { select: { id: true, stock: true, price: true, salePrice: true } },
        categories: { include: { category: { select: { name: true, path: true } } }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function getAdminProduct(id: string) {
  await assertAdmin();
  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
      categories: { include: { category: { select: { id: true, name: true, path: true } } } },
      attributeValues: { include: { attribute: true } },
    },
  });
}

async function syncCategories(tx: Prisma.TransactionClient, productId: string, categoryIds: string[], primaryCategoryId: string) {
  await tx.productCategory.deleteMany({ where: { productId } });
  for (const cid of categoryIds) {
    await tx.productCategory.create({ data: { productId, categoryId: cid, isPrimary: cid === primaryCategoryId } });
  }
}

async function syncAttributes(tx: Prisma.TransactionClient, productId: string, values: Array<{ code: string; value: string }>) {
  const defs = await tx.attributeDefinition.findMany({ where: { code: { in: values.map((v) => v.code) } } });
  const defByCode = new Map(defs.map((d) => [d.code, d]));
  await tx.productAttributeValue.deleteMany({ where: { productId } });
  for (const v of values) {
    const def = defByCode.get(v.code);
    if (!def || !v.value) continue;
    const row: {
      productId: string;
      attributeId: string;
      valueText?: string;
      valueNumber?: number;
      valueBool?: boolean;
      valueOption?: string;
    } = { productId, attributeId: def.id };
    if (def.type === "NUMBER") row.valueNumber = Number(v.value);
    else if (def.type === "BOOL") row.valueBool = v.value === "true";
    else if (def.type === "ENUM" || def.type === "COLOR") row.valueOption = v.value;
    else row.valueText = v.value;
    await tx.productAttributeValue.create({ data: row });
  }
}

export async function createProduct(input: ProductFormInput) {
  await assertAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  if (!data.categoryIds.includes(data.primaryCategoryId)) {
    return { ok: false as const, error: "Primary category must be one of the selected categories." };
  }
  const skus = data.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) return { ok: false as const, error: "Variant SKUs must be unique." };

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) return { ok: false as const, error: "A product with this slug already exists." };
  for (const sku of skus) {
    const dup = await prisma.productVariant.findUnique({ where: { sku } });
    if (dup) return { ok: false as const, error: `SKU "${sku}" is already in use.` };
  }

  const admin = await assertAdmin();
  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        brand: data.brand,
        basePrice: data.basePrice,
        baseSalePrice: nz(data.baseSalePrice),
        taxRatePct: nz(data.taxRatePct),
        status: data.status,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        createdById: admin.id,
      },
    });
    await syncCategories(tx, p.id, data.categoryIds, data.primaryCategoryId);
    await syncAttributes(tx, p.id, data.attributeValues);
    for (const v of data.variants) {
      const created = await tx.productVariant.create({
        data: {
          productId: p.id,
          sku: v.sku,
          price: v.price,
          salePrice: nz(v.salePrice ?? null),
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
          optionValues: v.optionValues,
          isActive: v.isActive,
        },
      });
      if (v.stock > 0) {
        await tx.stockLedger.create({ data: { variantId: created.id, delta: v.stock, reason: "initial", userId: admin.id, note: "Created via admin" } });
      }
    }
    return p;
  });

  await recordAudit({ action: "product.create", entityType: "Product", entityId: product.id, after: { slug: product.slug, status: product.status } });
  revalidatePath("/admin/products");
  revalidatePath(`/p/${product.slug}`);
  return { ok: true as const, id: product.id };
}

export async function updateProduct(id: string, input: ProductFormInput) {
  await assertAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const data = parsed.data;
  if (!data.categoryIds.includes(data.primaryCategoryId)) {
    return { ok: false as const, error: "Primary category must be one of the selected categories." };
  }

  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) return { ok: false as const, error: "Product not found." };

  // Validate slug change
  if (existing.slug !== data.slug) {
    const dup = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (dup) return { ok: false as const, error: "Another product uses this slug." };
  }

  const incomingSKUs = data.variants.map((v) => v.sku);
  if (new Set(incomingSKUs).size !== incomingSKUs.length) return { ok: false as const, error: "Variant SKUs must be unique." };

  const admin = await assertAdmin();
  const existingVariantIds = existing.variants.map((v) => v.id);
  const incomingVariantIds = data.variants.filter((v) => v.id).map((v) => v.id!);
  const toDelete = existingVariantIds.filter((vid) => !incomingVariantIds.includes(vid));

  // Prevent deleting variants that appear in orders
  if (toDelete.length) {
    const used = await prisma.orderItem.findMany({ where: { variantId: { in: toDelete } }, select: { variantId: true }, take: 1 });
    if (used.length) {
      return { ok: false as const, error: "Cannot delete a variant that has been purchased. Deactivate it instead." };
    }
  }

  await prisma.$transaction(async (tx) => {
    const beforeStatus = existing.status;
    const p = await tx.product.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        brand: data.brand,
        basePrice: data.basePrice,
        baseSalePrice: nz(data.baseSalePrice),
        taxRatePct: nz(data.taxRatePct),
        status: data.status,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        publishedAt: data.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });
    await syncCategories(tx, id, data.categoryIds, data.primaryCategoryId);
    await syncAttributes(tx, id, data.attributeValues);

    if (toDelete.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } });
    }
    for (const v of data.variants) {
      if (v.id) {
        const prevVariant = existing.variants.find((x) => x.id === v.id);
        if (prevVariant && prevVariant.stock !== v.stock) {
          const delta = v.stock - prevVariant.stock;
          await tx.stockLedger.create({ data: { variantId: v.id, delta, reason: "adjustment", userId: admin.id, note: "Edited via admin" } });
        }
        await tx.productVariant.update({
          where: { id: v.id },
          data: {
            sku: v.sku,
            price: v.price,
            salePrice: nz(v.salePrice ?? null),
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
            optionValues: v.optionValues,
            isActive: v.isActive,
          },
        });
      } else {
        const created = await tx.productVariant.create({
          data: {
            productId: id,
            sku: v.sku,
            price: v.price,
            salePrice: nz(v.salePrice ?? null),
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
            optionValues: v.optionValues,
            isActive: v.isActive,
          },
        });
        if (v.stock > 0) {
          await tx.stockLedger.create({ data: { variantId: created.id, delta: v.stock, reason: "initial", userId: admin.id, note: "Added via admin" } });
        }
      }
    }
    void beforeStatus; void p;
  });

  await recordAudit({ action: "product.update", entityType: "Product", entityId: id, before: { status: existing.status, slug: existing.slug }, after: { status: data.status, slug: data.slug } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/p/${data.slug}`);
  return { ok: true as const };
}

export async function setProductStatus(id: string, status: PublishStatus) {
  const admin = await assertAdmin();
  const existing = await prisma.product.findUnique({ where: { id }, select: { slug: true, status: true } });
  if (!existing) return { ok: false as const, error: "Product not found." };
  await prisma.product.update({
    where: { id },
    data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined },
  });
  await recordAudit({ action: `product.${status.toLowerCase()}`, entityType: "Product", entityId: id, before: { status: existing.status }, after: { status } });
  revalidatePath("/admin/products");
  revalidatePath(`/p/${existing.slug}`);
  void admin;
  return { ok: true as const };
}

export async function duplicateProduct(id: string) {
  const admin = await assertAdmin();
  const src = await prisma.product.findUnique({
    where: { id },
    include: { images: true, variants: true, categories: true, attributeValues: true },
  });
  if (!src) return { ok: false as const, error: "Product not found." };
  const baseSlug = `${src.slug}-copy`;
  let slug = baseSlug;
  let n = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const copy = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        slug,
        name: `${src.name} (Copy)`,
        shortDescription: src.shortDescription,
        description: src.description,
        brand: src.brand,
        basePrice: src.basePrice,
        baseSalePrice: src.baseSalePrice,
        taxRatePct: src.taxRatePct,
        status: "DRAFT",
        isFeatured: false,
        isNewArrival: false,
        seoTitle: src.seoTitle,
        seoDescription: src.seoDescription,
        createdById: admin.id,
      },
    });
    for (const c of src.categories) {
      await tx.productCategory.create({ data: { productId: p.id, categoryId: c.categoryId, isPrimary: c.isPrimary } });
    }
    for (const a of src.attributeValues) {
      await tx.productAttributeValue.create({
        data: {
          productId: p.id,
          attributeId: a.attributeId,
          valueText: a.valueText,
          valueNumber: a.valueNumber,
          valueBool: a.valueBool,
          valueOption: a.valueOption,
        },
      });
    }
    for (const v of src.variants) {
      let sku = `${v.sku}-COPY`;
      let i = 2;
      while (await tx.productVariant.findUnique({ where: { sku } })) sku = `${v.sku}-COPY-${i++}`;
      await tx.productVariant.create({
        data: {
          productId: p.id,
          sku,
          name: v.name,
          price: v.price,
          salePrice: v.salePrice,
          stock: 0,
          lowStockThreshold: v.lowStockThreshold,
          optionValues: v.optionValues as Prisma.JsonObject,
          isActive: v.isActive,
        },
      });
    }
    for (const img of src.images) {
      await tx.productImage.create({ data: { productId: p.id, url: img.url, alt: img.alt, sortOrder: img.sortOrder, isPrimary: img.isPrimary } });
    }
    return p;
  });
  await recordAudit({ action: "product.duplicate", entityType: "Product", entityId: copy.id, before: { fromId: id }, after: { slug: copy.slug } });
  revalidatePath("/admin/products");
  return { ok: true as const, id: copy.id };
}

export async function addProductImage(productId: string, file: File) {
  await assertAdmin();
  const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!existing) return { ok: false as const, error: "Product not found." };
  const uploaded = await storage().save(file, "products");
  if (!uploaded.ok) return { ok: false as const, error: uploaded.error };
  const count = await prisma.productImage.count({ where: { productId } });
  const img = await prisma.productImage.create({
    data: { productId, url: uploaded.url, sortOrder: count, isPrimary: count === 0, alt: null },
  });
  await recordAudit({ action: "product.image.add", entityType: "Product", entityId: productId, after: { imageId: img.id, size: uploaded.size, mime: uploaded.mime } });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true as const, image: { id: img.id, url: img.url } };
}

export async function removeProductImage(imageId: string) {
  await assertAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  await prisma.productImage.delete({ where: { id: imageId } });
  // If it was a /uploads path, remove the file
  if (img.url.startsWith("/uploads/")) {
    const rel = img.url.replace(/^\/uploads\//, "");
    await storage().remove(rel);
  }
  await recordAudit({ action: "product.image.remove", entityType: "Product", entityId: img.productId, before: { url: img.url } });
  revalidatePath(`/admin/products/${img.productId}`);
}

export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await assertAdmin();
  const existing = await prisma.productImage.findMany({ where: { productId }, select: { id: true } });
  const valid = new Set(existing.map((e) => e.id));
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      if (!valid.has(orderedIds[i])) continue;
      await tx.productImage.update({ where: { id: orderedIds[i] }, data: { sortOrder: i, isPrimary: i === 0 } });
    }
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function adjustStock(variantId: string, delta: number, note: string) {
  const admin = await assertAdmin();
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false as const, error: "Variant not found." };
  if (delta < 0 && variant.stock + delta < 0) {
    return { ok: false as const, error: "Adjustment would result in negative stock." };
  }
  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: delta } } });
    await tx.stockLedger.create({ data: { variantId, delta, reason: "adjustment", userId: admin.id, note } });
  });
  await recordAudit({ action: "stock.adjust", entityType: "ProductVariant", entityId: variantId, before: { stock: variant.stock }, after: { stock: variant.stock + delta, delta, note } });
  revalidatePath(`/admin/products/${variant.productId}`);
  return { ok: true as const };
}
