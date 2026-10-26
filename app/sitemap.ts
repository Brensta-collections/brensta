import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { POLICY_SLUGS } from "@/lib/policies";
import { categoryHasProductsInSubtree } from "@/lib/sitemap-utils";

// Generate on demand, not at build. A build-time DB query (invalid env,
// Neon cold-start timeout, dropped connection) must not block a deploy —
// the sitemap is low-stakes SEO content.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...POLICY_SLUGS.map((slug) => ({
      url: `${base}/p/policies/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  try {
    const [categories, products, productCategoryRows] = await Promise.all([
      prisma.category.findMany({ where: { status: "PUBLISHED" }, select: { path: true, updatedAt: true } }),
      prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.productCategory.findMany({
        where: { product: { status: "PUBLISHED" } },
        select: { category: { select: { path: true } } },
      }),
    ]);

    const pathsWithProducts = new Set(productCategoryRows.map((r) => r.category.path));
    const nonEmptyCategories = categories.filter((c) => categoryHasProductsInSubtree(c.path, pathsWithProducts));

    return [
      ...staticRoutes,
      ...nonEmptyCategories.map((c) => ({
        url: `${base}/c${c.path}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${base}/p/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    // Degrade gracefully: a sitemap missing dynamic entries is better than
    // a 500 that search engines will remember.
    console.warn(
      `[sitemap] serving static-only routes — DB query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return staticRoutes;
  }
}
