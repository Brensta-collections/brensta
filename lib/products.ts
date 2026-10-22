import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ProductListFilters = {
  categoryIds?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "popularity" | "newest" | "price_asc" | "price_desc";
  page?: number;
  perPage?: number;
};

export const PRODUCT_LIST_INCLUDE = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
  variants: {
    where: { isActive: true },
    orderBy: { createdAt: "asc" as const },
    select: { id: true, price: true, salePrice: true, stock: true, sku: true, optionValues: true },
  },
  categories: { include: { category: { select: { name: true, path: true } } } },
} satisfies Prisma.ProductInclude;

export async function listProducts(f: ProductListFilters = {}) {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
  if (f.categoryIds?.length) {
    where.categories = { some: { categoryId: { in: f.categoryIds } } };
  }
  if (f.search) {
    where.OR = [
      { name: { contains: f.search, mode: "insensitive" } },
      { shortDescription: { contains: f.search, mode: "insensitive" } },
      { description: { contains: f.search, mode: "insensitive" } },
    ];
  }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    where.basePrice = {};
    if (f.minPrice !== undefined) where.basePrice.gte = f.minPrice;
    if (f.maxPrice !== undefined) where.basePrice.lte = f.maxPrice;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    switch (f.sort) {
      case "price_asc":
        return { basePrice: "asc" };
      case "price_desc":
        return { basePrice: "desc" };
      case "newest":
        return { publishedAt: "desc" };
      default:
        return { isFeatured: "desc" };
    }
  })();

  const page = Math.max(1, f.page ?? 1);
  const perPage = Math.min(60, Math.max(1, f.perPage ?? 24));

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [orderBy, { createdAt: "desc" }],
      include: PRODUCT_LIST_INCLUDE,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, perPage, pages: Math.ceil(total / perPage) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      categories: { include: { category: { select: { name: true, path: true } } } },
      attributeValues: { include: { attribute: true } },
    },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    include: PRODUCT_LIST_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getNewArrivals(limit = 8) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", isNewArrival: true },
    include: PRODUCT_LIST_INCLUDE,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getRelatedProducts(productId: string, categoryIds: string[], limit = 4) {
  if (!categoryIds.length) return [];
  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: productId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: PRODUCT_LIST_INCLUDE,
    orderBy: { isFeatured: "desc" },
    take: limit,
  });
}
